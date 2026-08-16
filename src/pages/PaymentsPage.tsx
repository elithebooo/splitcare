import { useMemo, useState } from "react"

import { ActivityCard } from "../components/ActivityCard"
import { ExpenseSection } from "../components/ExpenseSection"
import type { Blocker } from "../components/PayCard"
import { PayCard } from "../components/PayCard"
import { ReceiptCard } from "../components/ReceiptCard"
import { SplitSection } from "../components/SplitSection"
import { WalletCard } from "../components/WalletCard"
import type { CareSplit } from "../hooks/useCareSplit"
import type { UseWallet } from "../hooks/useWallet"
import { isAmountLike, stroopsToStellarAmount } from "../lib/money"
import { signWithFreighter } from "../lib/freighter"
import { buildPaymentXdr, describeStellarError, isValidAddress, submitSignedXdr } from "../lib/stellar"
import { createId } from "../lib/id"
import { TOTAL_BP } from "../lib/split"
import type { PaymentPhase, Receipt } from "../types"

interface Props {
	careSplit: CareSplit
	wallet: UseWallet
}

export function PaymentsPage({ careSplit, wallet }: Props) {
	const [memo, setMemo] = useState("")
	const [phase, setPhase] = useState<PaymentPhase>("idle")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [receipts, setReceipts] = useState<Receipt[]>([])
	const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null)

	const {
		expenses,
		selectedExpense,
		selectedExpenseId,
		selectExpense,
		addCustomExpense,
		removeExpense,
		totalInput,
		setTotalInput,
		totalStroops,
		recipient,
		setRecipient,
		members,
		amounts,
		allocatedBp,
		addMember,
		removeMember,
		setMemberCount,
		renameMember,
		setMemberShare,
		toggleLock,
		resetToEqual,
		payer,
		payerIndex,
		payerAmountStroops,
		setPayer,
	} = careSplit

	const { wallet: walletState, connect, disconnect, refresh, fundAccount } = wallet

	const destinationLooksWrong = recipient.length > 0 && !isValidAddress(recipient)

	const blockers = useMemo<Blocker[]>(() => {
		const list: Blocker[] = []
		if (walletState.status !== "connected" || !walletState.address) {
			list.push({ id: "wallet", label: "Connect your Freighter wallet to pay." })
		} else if (!walletState.onTestnet) {
			list.push({ id: "network", label: "Switch Freighter to Stellar Testnet before paying." })
		} else if (!walletState.accountFunded) {
			list.push({ id: "funded", label: "Fund your Testnet account before paying." })
		}
		if (totalStroops === null || totalStroops <= 0n) {
			list.push({ id: "total", label: "Enter a total cost greater than zero." })
		}
		if (allocatedBp !== TOTAL_BP) {
			list.push({ id: "alloc", label: "Shares must add up to exactly 100% before paying." })
		}
		if (!recipient) {
			list.push({ id: "dest", label: "Enter a destination address." })
		} else if (!isValidAddress(recipient)) {
			list.push({ id: "dest-invalid", label: "Destination address is not a valid Stellar address." })
		}
		if (payerAmountStroops <= 0n) {
			list.push({ id: "share", label: "The payer's share must be greater than zero." })
		}
		return list
	}, [walletState, totalStroops, allocatedBp, recipient, payerAmountStroops])

	async function handlePay() {
		if (blockers.length > 0 || !walletState.address) return
		setErrorMessage(null)
		setPhase("building")
		try {
			const amount = stroopsToStellarAmount(payerAmountStroops)
			const xdr = await buildPaymentXdr({
				source: walletState.address,
				destination: recipient,
				amount,
				memo: memo.trim() ? memo.trim() : undefined,
			})

			setPhase("signing")
			const signedXdr = await signWithFreighter(xdr, walletState.address)

			setPhase("submitting")
			const result = await submitSignedXdr(signedXdr)

			setPhase("anticipating")
			await new Promise((resolve) => setTimeout(resolve, 1500))

			const receipt: Receipt = {
				id: createId("rcpt"),
				outcome: "success",
				hash: result,
				expenseTitle: selectedExpense?.title ?? "Custom expense",
				totalXlm: stroopsToStellarAmount(totalStroops ?? 0n),
				memberCount: members.length,
				payerName: payer?.name || `Member ${payerIndex + 1}`,
				payerPercent: (payer ? payer.bp / 100 : 0).toString(),
				paidXlm: amount,
				destination: recipient,
				createdAt: new Date().toISOString(),
			}
			setReceipts((prev) => [receipt, ...prev].slice(0, 20))
			setActiveReceipt(receipt)
			setPhase("done")
			void refresh()
		} catch (error) {
			const message = describeStellarError(error)
			setErrorMessage(message)
			const receipt: Receipt = {
				id: createId("rcpt"),
				outcome: "failure",
				errorMessage: message,
				expenseTitle: selectedExpense?.title ?? "Custom expense",
				totalXlm: stroopsToStellarAmount(totalStroops ?? 0n),
				memberCount: members.length,
				payerName: payer?.name || `Member ${payerIndex + 1}`,
				payerPercent: (payer ? payer.bp / 100 : 0).toString(),
				paidXlm: stroopsToStellarAmount(payerAmountStroops),
				destination: recipient,
				createdAt: new Date().toISOString(),
			}
			setReceipts((prev) => [receipt, ...prev].slice(0, 20))
			setPhase("idle")
		}
	}

	function handleReset() {
		setActiveReceipt(null)
		setErrorMessage(null)
		setPhase("idle")
	}

	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Payments</span>
				<h1 className="page__title">Split a care expense</h1>
				<p className="page__sub">
					Pick an expense, adjust the split, then send your share in testnet XLM.
				</p>
			</div>

			<div className="layout">
				<div className="layout__main">
					<ExpenseSection
						expenses={expenses}
						selectedExpenseId={selectedExpenseId}
						onSelect={selectExpense}
						onAddCustom={addCustomExpense}
						onRemove={removeExpense}
						totalInput={totalInput}
						onTotalChange={setTotalInput}
						totalIsValid={totalInput === "" || isAmountLike(totalInput)}
					/>
					<SplitSection
						members={members}
						amounts={amounts}
						allocatedBp={allocatedBp}
						payerId={payer?.id ?? ""}
						onSetPayer={setPayer}
						onRename={renameMember}
						onShareChange={setMemberShare}
						onToggleLock={toggleLock}
						onAddMember={addMember}
						onRemoveMember={removeMember}
						onCountChange={setMemberCount}
						onResetEqual={resetToEqual}
					/>
				</div>

				<aside className="layout__side">
					<WalletCard
						wallet={walletState}
						onConnect={() => void connect()}
						onDisconnect={disconnect}
						onRefresh={() => void refresh()}
						onFund={() => void fundAccount()}
					/>

					{activeReceipt ? (
						<ReceiptCard receipt={activeReceipt} onReset={handleReset} />
					) : (
						<PayCard
							payer={payer}
							payerAmountStroops={payerAmountStroops}
							totalStroops={totalStroops}
							memberCount={members.length}
							expenseTitle={selectedExpense?.title ?? "Custom expense"}
							destination={recipient}
							onDestinationChange={setRecipient}
							destinationLooksWrong={destinationLooksWrong}
							note={memo}
							onNoteChange={setMemo}
							blockers={blockers}
							phase={phase}
							onPay={() => void handlePay()}
							errorMessage={errorMessage}
						/>
					)}

					<ActivityCard receipts={receipts} onClear={() => setReceipts([])} />
				</aside>
			</div>
		</div>
	)
}
