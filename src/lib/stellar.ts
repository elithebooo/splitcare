import {
	Asset,
	BASE_FEE,
	Horizon,
	Memo,
	Networks,
	Operation,
	StrKey,
	TransactionBuilder,
} from "@stellar/stellar-sdk"

import { STROOPS_PER_XLM } from "./money"

export const HORIZON_URL = "https://horizon-testnet.stellar.org"
export const FRIENDBOT_URL = "https://friendbot.stellar.org"
export const TESTNET_PASSPHRASE = Networks.TESTNET
export const EXPLORER_BASE = "https://stellar.expert/explorer/testnet"

export const horizon = new Horizon.Server(HORIZON_URL)

export function explorerTxUrl(hash: string): string {
	return `${EXPLORER_BASE}/tx/${hash}`
}

export function explorerAccountUrl(address: string): string {
	return `${EXPLORER_BASE}/account/${address}`
}

export function isValidAddress(value: string): boolean {
	return StrKey.isValidEd25519PublicKey(value)
}

export interface AccountBalance {
	funded: boolean
	stroops: bigint
}

function toStroops(amount: string): bigint {
	const [whole, fraction = ""] = amount.split(".")
	const padded = (fraction + "0".repeat(7)).slice(0, 7)
	return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(padded || "0")
}

function getStatus(error: unknown): number | undefined {
	if (error && typeof error === "object" && "response" in error) {
		const response = (error as { response?: { status?: number } }).response
		return response?.status
	}
	return undefined
}

function isNotFound(error: unknown): boolean {
	return getStatus(error) === 404
}

export async function loadNativeBalance(address: string): Promise<AccountBalance> {
	try {
		const account = await horizon.loadAccount(address)
		const native = account.balances.find((b) => b.asset_type === "native")
		return { funded: true, stroops: native ? toStroops(native.balance) : 0n }
	} catch (error) {
		if (isNotFound(error)) return { funded: false, stroops: 0n }
		throw error
	}
}

export async function accountExists(address: string): Promise<boolean> {
	try {
		await horizon.loadAccount(address)
		return true
	} catch (error) {
		if (isNotFound(error)) return false
		throw error
	}
}

export async function fundWithFriendbot(address: string): Promise<void> {
	const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`)
	if (!response.ok) {
		throw new Error("Friendbot could not fund this account. Try again shortly.")
	}
}

export interface PaymentRequest {
	source: string
	destination: string
	amount: string
	memo?: string
}

export async function buildPaymentXdr(request: PaymentRequest): Promise<string> {
	const account = await horizon.loadAccount(request.source)

	const builder = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: TESTNET_PASSPHRASE,
	})
		.addOperation(
			Operation.payment({
				destination: request.destination,
				asset: Asset.native(),
				amount: request.amount,
			}),
		)
		.setTimeout(180)

	const trimmedMemo = request.memo?.trim()
	if (trimmedMemo) {
		builder.addMemo(Memo.text(trimmedMemo.slice(0, 28)))
	}

	return builder.build().toXDR()
}

export async function submitSignedXdr(signedXdr: string): Promise<string> {
	const transaction = TransactionBuilder.fromXDR(signedXdr, TESTNET_PASSPHRASE)
	const result = await horizon.submitTransaction(transaction)
	return result.hash
}

const OPERATION_ERRORS: Record<string, string> = {
	op_underfunded: "The sending account does not have enough XLM for this payment.",
	op_no_destination: "The destination account does not exist on Testnet.",
	op_line_full: "The destination cannot receive this amount right now.",
	op_malformed: "The payment could not be built correctly. Please try again.",
}

const TRANSACTION_ERRORS: Record<string, string> = {
	tx_insufficient_balance:
		"The sending account does not have enough XLM to cover this payment and the network fee.",
	tx_bad_seq: "This transaction expired or was already used. Please try again.",
	tx_too_late: "This transaction took too long to submit. Please try again.",
	tx_insufficient_fee: "The network fee was too low. Please try again.",
}

export function describeStellarError(error: unknown): string {
	if (error instanceof Error && /failed to fetch/i.test(error.message)) {
		return "Could not reach the Stellar Testnet. Check your connection and try again."
	}

	if (isNotFound(error)) {
		return "The sending account does not exist on Testnet yet. Fund it with Friendbot first."
	}

	const resultCodes = (
		error as {
			response?: {
				data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } }
			}
		}
	)?.response?.data?.extras?.result_codes

	if (resultCodes?.operations?.length) {
		const opCode = resultCodes.operations[0]
		if (opCode in OPERATION_ERRORS) return OPERATION_ERRORS[opCode]
	}

	if (resultCodes?.transaction && resultCodes.transaction in TRANSACTION_ERRORS) {
		return TRANSACTION_ERRORS[resultCodes.transaction]
	}

	if (error instanceof Error && error.message) return error.message

	return "Something went wrong while sending the payment. Please try again."
}
