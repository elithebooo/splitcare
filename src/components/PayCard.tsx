import { formatXlm } from "../lib/money"
import type { Member, PaymentPhase } from "../types"
import { Alert, ArrowUpRight, Bolt } from "./Icons"

export interface Blocker {
	id: string
	label: string
}

interface Props {
	payer: Member | null
	payerAmountStroops: bigint
	totalStroops: bigint | null
	memberCount: number
	expenseTitle: string
	destination: string
	onDestinationChange: (value: string) => void
	destinationLooksWrong: boolean
	note: string
	onNoteChange: (value: string) => void
	blockers: Blocker[]
	phase: PaymentPhase
	onPay: () => void
	errorMessage: string | null
}

const PHASE_LABEL: Record<PaymentPhase, string> = {
	idle: "Pay my share",
	building: "Preparing transaction",
	signing: "Waiting for Freighter",
	submitting: "Submitting to Testnet",
	anticipating: "Checking transaction",
	done: "Pay my share",
}

export function PayCard({
	payer,
	payerAmountStroops,
	totalStroops,
	memberCount,
	expenseTitle,
	destination,
	onDestinationChange,
	destinationLooksWrong,
	note,
	onNoteChange,
	blockers,
	phase,
	onPay,
	errorMessage,
}: Props) {
	const isBusy = phase === "building" || phase === "signing" || phase === "submitting" || phase === "anticipating"
	const canPay = blockers.length === 0 && !isBusy

	return (
		<div className="card">
			<div className="card__head">
				<h3 className="card__title">Step 03 · Pay your share</h3>
			</div>

			<div className="hero">
				<span className="hero__value">
					<span className="hero__num">{formatXlm(payerAmountStroops)}</span>
					<span className="hero__unit">XLM</span>
				</span>
				<span className="hero__sub">
					{payer?.name || "Selected payer"} · {expenseTitle} · {memberCount}{" "}
					{memberCount === 1 ? "person" : "people"}
				</span>
			</div>

			<dl className="kv">
				<div className="kv__row">
					<dt className="kv__k">Total expense</dt>
					<dd className="kv__v num">{totalStroops !== null ? formatXlm(totalStroops) : "—"} XLM</dd>
				</div>
			</dl>

			<label className="field pay-field">
				<span className="field__label">Destination address</span>
				<input
					className={`input input--mono${destinationLooksWrong ? " input--invalid" : ""}`}
					value={destination}
					onChange={(e) => onDestinationChange(e.target.value.trim())}
					placeholder="G..."
					spellCheck={false}
				/>
				{destinationLooksWrong ? (
					<span className="field__error">This doesn't look like a Stellar public key.</span>
				) : (
					<span className="field__hint">Use a funded Stellar Testnet account. New accounts must exist before receiving payment.</span>
				)}
				<a className="field__link" href="https://laboratory.stellar.org/#account-creator?network=test" target="_blank" rel="noreferrer">
					Create a Testnet destination
					<ArrowUpRight size={12} />
				</a>
			</label>

			<label className="field pay-field">
				<span className="field__label">Memo (optional)</span>
				<input
					className="input"
					value={note}
					onChange={(e) => onNoteChange(e.target.value)}
					placeholder="Short note for this payment"
					maxLength={28}
				/>
			</label>

			<button type="button" className={`btn btn--primary btn--block pay-cta ${phase === "anticipating" ? "animate-pulse" : ""}`} disabled={!canPay} onClick={onPay}>
				{isBusy ? <span className="spinner" /> : <Bolt size={15} />}
				{PHASE_LABEL[phase]}
			</button>

			{errorMessage ? (
				<div className="banner banner--err">
					<Alert size={14} />
					<span>{errorMessage}</span>
				</div>
			) : null}

			{blockers.length > 0 ? (
				<ul className="blockers">
					{blockers.map((blocker) => (
						<li key={blocker.id} className="blocker">
							{blocker.label}
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
