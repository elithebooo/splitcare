import { formatXlm, shortenAddress } from "../lib/money"
import { explorerTxUrl } from "../lib/stellar"
import type { FeedExpense } from "../types"
import { Alert, Refresh } from "./Icons"

interface Props {
	expenses: FeedExpense[]
	syncing: boolean
	latestLedger: number | null
	enabled: boolean
	error: string | null
	onRefresh: () => void
}

/** Live, event-driven list of on-chain expenses (rebuilt from contract events). */
export function LiveExpenses({ expenses, syncing, latestLedger, enabled, error, onRefresh }: Props) {
	return (
		<div className="card">
			<div className="card__head">
				<h3 className="card__title">On-chain expenses</h3>
				<span className={`livedot${syncing ? " livedot--sync" : ""}`} title="Live sync" aria-hidden="true" />
			</div>

			<p className="fineprint">
				Rebuilt from SplitCare contract events, refreshed every few seconds.
				{latestLedger !== null ? ` Latest ledger: ${latestLedger}.` : ""}
			</p>

			{!enabled ? (
				<div className="banner banner--warn">
					<Alert size={14} />
					<span>
						Live sync is off until the contract is deployed and VITE_CONTRACT_ID is set (see
						scripts/deploy-contract.sh).
					</span>
				</div>
			) : null}

			{error ? (
				<div className="banner banner--err">
					<Alert size={14} />
					<span>{error}</span>
				</div>
			) : null}

			{expenses.length === 0 ? (
				<p className="empty">No on-chain expenses yet. Publish one from the Payments page.</p>
			) : (
				<div className="feed">
					{expenses.map((expense) => (
						<FeedCard key={expense.id} expense={expense} />
					))}
				</div>
			)}

			<div style={{ marginTop: 12 }}>
				<button type="button" className="btn btn--quiet btn--sm" onClick={onRefresh}>
					<Refresh size={13} />
					Sync now
				</button>
			</div>
		</div>
	)
}

function FeedCard({ expense }: { expense: FeedExpense }) {
	const paidCount = expense.members.filter((member) => member.paid).length
	const paidStroops = expense.members.reduce(
		(sum, member) => sum + (member.paid ? member.amountStroops : 0n),
		0n,
	)
	const percent = expense.totalStroops > 0n ? Number((paidStroops * 100n) / expense.totalStroops) : 0

	return (
		<article className="feed__item">
			<header className="feed__head">
				<strong>{expense.title}</strong>
				<span className="num">{formatXlm(expense.totalStroops)} XLM</span>
			</header>

			<div className="progress" aria-hidden="true">
				<span style={{ width: `${percent}%` }} />
			</div>

			<p className="feed__meta">
				{paidCount}/{expense.members.length} shares paid · {formatXlm(paidStroops)} XLM collected ·
				created by {shortenAddress(expense.creator)}
			</p>

			<ul className="feed__members">
				{expense.members.map((member, index) => (
					<li
						key={`${expense.id}-${index}`}
						className={`feed__member${member.paid ? " feed__member--paid" : ""}`}
					>
						<span>{member.name}</span>
						<span className="num">{formatXlm(member.amountStroops)} XLM</span>
						{member.paid ? (
							member.txHash ? (
								<a href={explorerTxUrl(member.txHash)} target="_blank" rel="noreferrer">
									paid ✓
								</a>
							) : (
								<span className="feed__paid">paid ✓</span>
							)
						) : (
							<span className="feed__unpaid">unpaid</span>
						)}
					</li>
				))}
			</ul>
		</article>
	)
}
