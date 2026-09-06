import { useEffect, useMemo, useRef, useState } from "react"

import { ActivityCard } from "../components/ActivityCard"
import { ExpenseSection } from "../components/ExpenseSection"
import type { Blocker } from "../components/PayCard"
import { PayCard } from "../components/PayCard"
import { ReceiptCard } from "../components/ReceiptCard"
import { SplitSection } from "../components/SplitSection"
import { TxStatusCard } from "../components/TxStatusCard"
import { WalletCard } from "../components/WalletCard"
import { CONTRACT_ENABLED } from "../config"
import type { CareSplit } from "../hooks/useCareSplit"
import { useSplitCareContract } from "../hooks/useContract"
import type { UseContractEvents } from "../hooks/useContractEvents"
import type { UseWallet } from "../hooks/useWallet"
import { errorMessage } from "../lib/errors"
import { createId } from "../lib/id"
import { formatXlm, isAmountLike, stroopsToStellarAmount } from "../lib/money"
import { TOTAL_BP } from "../lib/split"
import { buildPaymentXdr, describeStellarError, isValidAddress, submitSignedXdr } from "../lib/stellar"
import type { PaymentPhase, Receipt } from "../types"

interface Props {
	careSplit: CareSplit
	wallet: UseWallet
	contractEvents: UseContractEvents
}

/** Extra buffer on top of the share to cover the network fee (0.01 XLM). */
const FEE_BUFFER_STROOPS = 100_000n

export function PaymentsPage({ careSplit, wallet, contractEvents }: Props) {
	const [memo, setMemo] = useState("")
	const [phase, setPhase] = useState<PaymentPhase>("idle")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [recordWarning, setRecordWarning] = useState<string | null>(null)
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

	const {
		wallet: walletState,
		wallets,
		walletsLoading,
		connectingId,
		connect,
		disconnect,
		refresh,
		fundAccount,
		sign,
	} = wallet

	const contract = useSplitCareContract(walletState.address, sign)

	/* --- On-chain publishing ------------------------------------------ */

	// Signature of the current split configuration; editing anything republishes as a new expense.
	const configSig = useMemo(
		() =>
			JSON.stringify({
				e: selectedExpenseId,
				t: totalInput,
				m: members.map((member) => [member.name, member.bp]),
			}),
		[selectedExpenseId, totalInput, members],
	)

	const draftIdRef = useRef(createId("expense"))
	useEffect(() => {
		draftIdRef.current = createId("expense")
	}, [configSig])

	const [publishedId, setPublishedId] = useState<string | null>(null)
	const [publishedSig, setPublishedSig] = useState<string | null>(null)
	const published = CONTRACT_ENABLED && publishedId !== null && publishedSig === configSig

	const contractBusy =
		contract.status.stage === "preparing" ||
		contract.status.stage === "awaiting-signature" ||
		contract.status.stage === "submitting" ||
		contract.status.stage === "pending"

	const canPublish =
		CONTRACT_ENABLED &&
		walletState.status === "connected" &&
		walletState.address !== null &&
		walletState.onTestnet &&
		walletState.accountFunded &&
		totalStroops !== null &&
		totalStroops > 0n &&
		allocatedBp === TOTAL_BP &&
		members.length > 0

	async function handlePublish() {
		if (!canPublish || contractBusy) return
		setErrorMessage(null)
		setRecordWarning(null)
		try {
			await contract.publishExpense({
				id: draftIdRef.current,
				title: selectedExpense?.title ?? "Custom expense",
				shares: members.map((member, index) => ({
					name: member.name.trim() || `Person ${index + 1}`,
					amountStroops: amounts[index] ?? 0n,
				})),
			})
			setPublishedId(draftIdRef.current)
			setPublishedSig(configSig)
			void contractEvents.refresh()
		} catch {
			// Failure (rejected/failed) is shown in the TxStatusCard.
		}
	}

	/* --- Payment flow --------------------------------------------------- */

	const destinationLooksWrong = recipient.length > 0 && !isValidAddress(recipient)

	const blockers = useMemo<Blocker[]>(() => {
		const list: Blocker[] = []
		if (walletState.status !== "connected" || !walletState.address) {
			list.push({ id: "wallet", label: "Connect a Stellar wallet to pay." })
		} else if (!walletState.onTestnet) {
			list.push({ id: "network", label: "Switch your wallet to Stellar Testnet before paying." })
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
		if (walletState.balanceStroops !== null && payerAmountStroops > 0n) {
			const needed = payerAmountStroops + FEE_BUFFER_STROOPS
			if (walletState.balanceStroops < needed) {
				list.push({
					id: "balance",
					label: `Insufficient balance: this share is ${formatXlm(payerAmountStroops)} XLM plus fees, but the wallet holds ${formatXlm(walletState.balanceStroops)} XLM.`,
				})
			}
		}
		if (CONTRACT_ENABLED && !published) {
			list.push({ id: "publish", label: "Publish this expense on the Soroban contract before paying." })
		}
		return list
	}, [walletState, totalStroops, allocatedBp, recipient, payerAmountStroops, published])

	async function handlePay() {
		if (blockers.length > 0 || !walletState.address) return
		setErrorMessage(null)
		setRecordWarning(null)
		contract.resetStatus()
		setPhase("building")
		try {
			const amount = stroopsToStellarAmount(payerAmountStroops)
			const cleanedMemo = memo.trim()
			const xdr = await buildPaymentXdr({
				source: walletState.address,
				destination: recipient,
				amount,
				memo: cleanedMemo || undefined,
			})

			setPhase("signing")
			const signedXdr = await sign(xdr, walletState.address)

			setPhase("submitting")
			const hash = await submitSignedXdr(signedXdr)

			setPhase("anticipating")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Level 2: record the payment on the Soroban contract.
			let contractTxHash: string | undefined
			if (CONTRACT_ENABLED && published && publishedId) {
				setPhase("recording")
				try {
					contractTxHash = await contract.recordPayment({
						expenseId: publishedId,
						memberIndex: payerIndex,
						paymentTxHash: hash,
					})
					void contractEvents.refresh()
				} catch (recordError) {
					// The XLM payment already succeeded; recording is reported as a warning.
					setRecordWarning(
						errorMessage(recordError, "Payment succeeded, but recording it on the contract failed."),
					)
				}
			}

			const receipt: Receipt = {
				id: createId("rcpt"),
				outcome: "success",
				hash,
				contractTxHash,
				expenseOnchainId: publishedId ?? undefined,
				expenseTitle: selectedExpense?.title ?? "Custom expense",
				totalXlm: stroopsToStellarAmount(totalStroops ?? 0n),
				memberCount: members.length,
				payerName: payer?.name || `Person ${payerIndex + 1}`,
				payerPercent: (payer ? payer.bp / 100 : 0).toString(),
				paidXlm: amount,
				source: walletState.address,
				destination: recipient,
				memo: cleanedMemo || undefined,
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
				payerName: payer?.name || `Person ${payerIndex + 1}`,
				payerPercent: (payer ? payer.bp / 100 : 0).toString(),
				paidXlm: stroopsToStellarAmount(payerAmountStroops),
				source: walletState.address,
				destination: recipient,
				memo: memo.trim() || undefined,
				createdAt: new Date().toISOString(),
			}
			setReceipts((prev) => [receipt, ...prev].slice(0, 20))
			setPhase("idle")
		}
	}

	function handleReset() {
		setActiveReceipt(null)
		setErrorMessage(null)
		setRecordWarning(null)
		contract.resetStatus()
		setPhase("idle")
	}

	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Payments</span>
				<h1 className="page__title">Split a care expense</h1>
				<p className="page__sub">
					Pick an expense, adjust the split, publish it on-chain, then pay your share in testnet
					XLM.
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
						wallets={wallets}
						walletsLoading={walletsLoading}
						connectingId={connectingId}
						onConnect={(walletId) => void connect(walletId)}
						onDisconnect={disconnect}
						onRefresh={() => void refresh()}
						onFund={() => void fundAccount()}
					/>

					<TxStatusCard status={contract.status} title="Contract transaction" />

					{recordWarning ? (
						<div className="banner banner--warn" role="status">
							{recordWarning}
						</div>
					) : null}

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
							contractEnabled={CONTRACT_ENABLED}
							published={published}
							canPublish={canPublish}
							contractBusy={contractBusy}
							onPublish={() => void handlePublish()}
						/>
					)}

					<ActivityCard
						receipts={receipts}
						liveEvents={contractEvents.events}
						onClear={() => setReceipts([])}
					/>
				</aside>
			</div>
		</div>
	)
}
