import { useCallback, useState } from "react"

import type { xdr } from "@stellar/stellar-sdk"

import {
	buildCreateExpenseArgs,
	buildRecordPaymentArgs,
	invokeContract,
	readExpense,
	type ShareInput,
} from "../lib/contract"
import { AppError, toAppError } from "../lib/errors"
import type { FeedExpense, TxStatus } from "../types"

const IDLE: TxStatus = { stage: "idle", hash: null, error: null }

export type SignFn = (xdr: string, address: string) => Promise<string>

/** Low-level contract transaction runner with visible status. */
export function useContractTx(sign: SignFn) {
	const [status, setStatus] = useState<TxStatus>(IDLE)

	const run = useCallback(
		async (method: string, args: xdr.ScVal[], source: string): Promise<string> => {
			setStatus({ stage: "preparing", hash: null, error: null })
			try {
				const hash = await invokeContract({
					method,
					args,
					source,
					sign,
					onStage: (stage, stageHash) =>
						setStatus((current) => ({ stage, hash: stageHash ?? current.hash, error: null })),
				})
				setStatus({ stage: "success", hash, error: null })
				return hash
			} catch (error) {
				const appError = toAppError(error, "The contract call failed.")
				setStatus((current) => ({
					stage: appError.code === "rejected" ? "rejected" : "failed",
					hash: current.hash,
					error: appError.message,
				}))
				throw appError
			}
		},
		[sign],
	)

	const reset = useCallback(() => setStatus(IDLE), [])

	return { status, run, reset }
}

export type UseContractTx = ReturnType<typeof useContractTx>

/** High-level SplitCare contract actions bound to the connected wallet. */
export function useSplitCareContract(address: string | null, sign: SignFn) {
	const { status, run, reset } = useContractTx(sign)

	const publishExpense = useCallback(
		async (input: { id: string; title: string; shares: ShareInput[] }): Promise<string> => {
			if (!address) {
				throw new AppError("wallet-not-found", "Connect a wallet before publishing on-chain.")
			}
			return run("create_expense", buildCreateExpenseArgs(address, input.id, input.title, input.shares), address)
		},
		[address, run],
	)

	const recordPayment = useCallback(
		async (input: { expenseId: string; memberIndex: number; paymentTxHash: string }): Promise<string> => {
			if (!address) {
				throw new AppError("wallet-not-found", "Connect a wallet before recording a payment.")
			}
			return run(
				"record_payment",
				buildRecordPaymentArgs(input.expenseId, input.memberIndex, address, input.paymentTxHash),
				address,
			)
		},
		[address, run],
	)

	const loadExpense = useCallback(
		async (expenseId: string): Promise<FeedExpense> => {
			if (!address) {
				throw new AppError("wallet-not-found", "Connect a wallet to read the contract.")
			}
			return readExpense(expenseId, address)
		},
		[address],
	)

	return { status, publishExpense, recordPayment, loadExpense, resetStatus: reset }
}

export type UseSplitCareContract = ReturnType<typeof useSplitCareContract>
