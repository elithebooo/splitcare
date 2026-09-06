import {
	Account,
	Address,
	BASE_FEE,
	Contract,
	Networks,
	TransactionBuilder,
	nativeToScVal,
	rpc,
	scValToNative,
	xdr,
} from "@stellar/stellar-sdk"

import { CONTRACT_ENABLED, CONTRACT_ID, SOROBAN_RPC_URL } from "../config"
import { AppError, toAppError } from "./errors"
import { stroopsToStellarAmount } from "./money"
import type { ContractEventInfo, FeedExpense, FeedMember, TxStage } from "../types"

/** Shared Soroban RPC server (testnet by default, see src/config.ts). */
export const sorobanServer = new rpc.Server(SOROBAN_RPC_URL)

const TX_TIMEOUT_SECONDS = 60
const SIMULATE_TIMEOUT_SECONDS = 30
const POLL_ATTEMPTS = 30
const POLL_INTERVAL_MS = 1_500
const EVENT_WINDOW_LEDGERS = 20_000
const EVENT_PAGE_LIMIT = 50

function requireContract(): Contract {
	if (!CONTRACT_ENABLED) {
		throw new AppError(
			"contract",
			"Contract id is not configured yet. Deploy the contract (scripts/deploy-contract.sh) and set VITE_CONTRACT_ID.",
		)
	}
	return new Contract(CONTRACT_ID)
}

/* ------------------------------------------------------------------ */
/* Argument builders                                                   */
/* ------------------------------------------------------------------ */

export interface ShareInput {
	name: string
	amountStroops: bigint
}

export function buildCreateExpenseArgs(
	creator: string,
	id: string,
	title: string,
	shares: ShareInput[],
): xdr.ScVal[] {
	return [
		new Address(creator).toScVal(),
		nativeToScVal(id, { type: "string" }),
		nativeToScVal(title, { type: "string" }),
		nativeToScVal(shares.map((share) => [share.name, share.amountStroops])),
	]
}

export function buildRecordPaymentArgs(
	expenseId: string,
	memberIndex: number,
	payer: string,
	paymentTxHash: string,
): xdr.ScVal[] {
	return [
		nativeToScVal(expenseId, { type: "string" }),
		nativeToScVal(memberIndex, { type: "u32" }),
		new Address(payer).toScVal(),
		nativeToScVal(paymentTxHash, { type: "string" }),
	]
}

/* ------------------------------------------------------------------ */
/* Read path (simulation, no signature needed)                         */
/* ------------------------------------------------------------------ */

interface RawMemberShare {
	name: string
	amount: string | number | bigint
	paid: boolean
	paid_by: string | null
	tx_hash: string | null
}

interface RawExpense {
	id: string
	creator: string
	title: string
	total: string | number | bigint
	members: RawMemberShare[]
	created_ledger: number
}

function toBigInt(value: string | number | bigint): bigint {
	return typeof value === "bigint" ? value : BigInt(value)
}

function toFeedExpense(raw: RawExpense, createdTxHash: string | null): FeedExpense {
	return {
		id: raw.id,
		creator: raw.creator,
		title: raw.title,
		totalStroops: toBigInt(raw.total),
		members: raw.members.map(
			(member): FeedMember => ({
				name: member.name,
				amountStroops: toBigInt(member.amount),
				paid: Boolean(member.paid),
				paidBy: member.paid_by ?? null,
				txHash: member.tx_hash ?? null,
			}),
		),
		createdLedger: raw.created_ledger,
		createdTxHash,
	}
}

function simulationMessage(sim: rpc.Api.SimulateTransactionResponse, fallback: string): string {
	if ("error" in sim && typeof sim.error === "string" && sim.error.length > 0) {
		if (/not found/i.test(sim.error)) return "The contract could not find that expense."
		if (/already exists/i.test(sim.error)) return "That expense id is already published on-chain."
		if (/already paid/i.test(sim.error)) return "That share is already marked as paid on-chain."
		return `Contract rejected the call: ${sim.error.slice(0, 160)}`
	}
	return fallback
}

/** Reads an expense from the contract by simulating get_expense. */
export async function readExpense(id: string, source: string): Promise<FeedExpense> {
	const account = new Account(source, "0")
	const tx = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(requireContract().call("get_expense", nativeToScVal(id, { type: "string" })))
		.setTimeout(SIMULATE_TIMEOUT_SECONDS)
		.build()

	let sim: rpc.Api.SimulateTransactionResponse
	try {
		sim = await sorobanServer.simulateTransaction(tx)
	} catch (error) {
		throw toAppError(error, "Could not reach Soroban RPC to read the contract.")
	}

	if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
		return toFeedExpense(scValToNative(sim.result.retval) as RawExpense, null)
	}
	throw new AppError("contract", simulationMessage(sim, "Could not read this expense from the contract."))
}

/* ------------------------------------------------------------------ */
/* Write path (simulate → sign → submit → poll)                        */
/* ------------------------------------------------------------------ */

export interface InvokeOptions {
	method: string
	args: xdr.ScVal[]
	/** Wallet address that authorizes and funds the call. */
	source: string
	sign: (xdr: string, address: string) => Promise<string>
	onStage?: (stage: TxStage, hash: string | null) => void
}

/**
 * Invokes a contract method end to end and reports the visible lifecycle:
 * preparing → awaiting-signature → submitting → pending → success.
 * Throws AppError with code "rejected" / "contract" / "rpc" / "network" on failure.
 */
export async function invokeContract(options: InvokeOptions): Promise<string> {
	const { method, args, source, sign, onStage } = options

	onStage?.("preparing", null)

	let account: Account
	try {
		account = await sorobanServer.getAccount(source)
	} catch {
		throw new AppError(
			"network",
			"Could not load your account from Soroban RPC. Fund the wallet with Friendbot first.",
		)
	}

	const built = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(requireContract().call(method, ...args))
		.setTimeout(TX_TIMEOUT_SECONDS)
		.build()

	let preparedXdr: string
	try {
		const sim = await sorobanServer.simulateTransaction(built)
		if (!rpc.Api.isSimulationSuccess(sim)) {
			throw new AppError("contract", simulationMessage(sim, "The contract rejected this call during simulation."))
		}
		preparedXdr = rpc.assembleTransaction(built, sim).build().toXDR()
	} catch (error) {
		if (error instanceof AppError) throw error
		throw toAppError(error, "Could not prepare the contract transaction.")
	}

	onStage?.("awaiting-signature", null)
	const signedXdr = await sign(preparedXdr, source)
	const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)

	onStage?.("submitting", null)
	let hash: string
	try {
		const sent = await sorobanServer.sendTransaction(signed)
		if (sent.status === "ERROR") {
			throw new AppError("rpc", "Soroban RPC rejected the transaction. Please try again.")
		}
		if (sent.status === "TRY_AGAIN_LATER") {
			throw new AppError("rpc", "Soroban RPC is busy. Please try again in a moment.")
		}
		hash = sent.hash
	} catch (error) {
		if (error instanceof AppError) throw error
		throw toAppError(error, "The transaction could not be submitted to Soroban RPC.")
	}

	onStage?.("pending", hash)
	await waitForTransaction(hash)
	onStage?.("success", hash)
	return hash
}

async function waitForTransaction(hash: string): Promise<void> {
	for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
		try {
			const result = await sorobanServer.getTransaction(hash)
			if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) return
			if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
				throw new AppError("contract", "The contract transaction failed on-chain.")
			}
		} catch (error) {
			if (error instanceof AppError) throw error
			// transient RPC hiccups while polling are retried
		}
		await sleep(POLL_INTERVAL_MS)
	}
	throw new AppError(
		"network",
		"The transaction is still pending. Check the explorer for its final status.",
	)
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ------------------------------------------------------------------ */
/* Events (real-time sync)                                             */
/* ------------------------------------------------------------------ */

export interface EventsPage {
	events: ContractEventInfo[]
	latestLedger: number
	cursor: string | null
}

/**
 * Fetches contract events. Without a cursor it reads a recent ledger window;
 * with a cursor it returns only events after that point (used for polling).
 * Note: GetEventsRequest is a discriminated union in the SDK — pass either a
 * cursor or a startLedger, never both.
 */
export async function fetchContractEvents(options: { cursor?: string | null } = {}): Promise<EventsPage> {
	requireContract()

	const filters: rpc.Api.EventFilter[] = [{ type: "contract", contractIds: [CONTRACT_ID] }]

	const response = options.cursor
		? await sorobanServer.getEvents({ filters, cursor: options.cursor, limit: EVENT_PAGE_LIMIT })
		: await sorobanServer.getEvents({
				filters,
				startLedger: Math.max(1, (await sorobanServer.getLatestLedger()).sequence - EVENT_WINDOW_LEDGERS),
				limit: EVENT_PAGE_LIMIT,
			})

	const events: ContractEventInfo[] = []
	for (const event of response.events) {
		const parsed = parseContractEvent(event)
		if (parsed) events.push(parsed)
	}

	return {
		events,
		latestLedger: response.latestLedger,
		cursor:
			response.cursor ||
			(response.events.length > 0
				? response.events[response.events.length - 1].id
				: (options.cursor ?? null)),
	}
}

function symbolAsString(value: xdr.ScVal): string | null {
	try {
		const native = scValToNative(value)
		return typeof native === "string" ? native : null
	} catch {
		return null
	}
}

function parseContractEvent(event: rpc.Api.EventResponse): ContractEventInfo | null {
	const topics = event.topic ?? []
	if (topics.length < 2) return null
	if (symbolAsString(topics[0]) !== "splitcare") return null

	const kind = symbolAsString(topics[1])
	const txHash = typeof event.txHash === "string" ? event.txHash : null
	const closedAt = event.ledgerClosedAt ?? ""

	if (kind === "created") {
		const data = scValToNative(event.value) as [string, string, string, string | number | bigint, RawMemberShare[]]
		const [id, creator, title, total, rawMembers] = data
		const members: FeedMember[] = rawMembers.map((member) => ({
			name: member.name,
			amountStroops: toBigInt(member.amount),
			paid: Boolean(member.paid),
			paidBy: member.paid_by ?? null,
			txHash: member.tx_hash ?? null,
		}))
		return {
			id: event.id,
			kind: "created",
			expenseId: id,
			ledger: event.ledger,
			closedAt,
			txHash,
			summary: `Expense published: ${title} (${stroopsToStellarAmount(toBigInt(total))} XLM)`,
			created: { id, creator, title, totalStroops: toBigInt(total), members, createdLedger: event.ledger },
		}
	}

	if (kind === "paid") {
		const data = scValToNative(event.value) as [string, number, string, string | number | bigint, string]
		const [id, memberIndex, payer, amount, paymentTxHash] = data
		return {
			id: event.id,
			kind: "paid",
			expenseId: id,
			ledger: event.ledger,
			closedAt,
			txHash,
			summary: `Share #${Number(memberIndex) + 1} paid: ${stroopsToStellarAmount(toBigInt(amount))} XLM`,
			memberIndex: Number(memberIndex),
			payer,
			amountStroops: toBigInt(amount),
			paymentTxHash,
		}
	}

	return null
}

/** Rebuilds expense state from the event stream (newest first). */
export function buildFeed(events: ContractEventInfo[]): FeedExpense[] {
	const byId = new Map<string, FeedExpense>()

	for (const event of events) {
		if (event.kind === "created" && event.created) {
			byId.set(event.expenseId, {
				...event.created,
				members: event.created.members.map((member) => ({ ...member })),
				createdTxHash: event.txHash,
			})
		} else if (event.kind === "paid") {
			const expense = byId.get(event.expenseId)
			if (!expense || event.memberIndex === undefined) continue
			const member = expense.members[event.memberIndex]
			if (!member) continue
			member.paid = true
			member.paidBy = event.payer ?? null
			member.txHash = event.paymentTxHash ?? event.txHash
		}
	}

	return [...byId.values()].sort((a, b) => b.createdLedger - a.createdLedger)
}
