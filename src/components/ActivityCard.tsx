import { explorerTxUrl } from "../lib/stellar"
import type { Receipt } from "../types"

interface Props {
	receipts: Receipt[]
	onClear: () => void
}

function relativeTime(iso: string): string {
	const then = new Date(iso).getTime()
	if (Number.isNaN(then)) return ""
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
	if (seconds < 45) return "just now"
	if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
	if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`
	return `${Math.round(seconds / 86_400)}d ago`
}

export function ActivityCard({ receipts, onClear }: Props) {
	return (
		<div className="card">
			<div className="card__head">
				<h3 className="card__title">This session</h3>
				{receipts.length > 0 ? (
					<button type="button" className="linkbtn" onClick={onClear}>
						Clear
					</button>
				) : null}
			</div>

			{receipts.length === 0 ? (
				<p className="empty">
					Payments you make in this tab show up here with their transaction hash. Nothing is stored
					after you close the page.
				</p>
			) : (
				<div className="activity">
					{receipts.map((receipt) => {
						const body = (
							<>
								<span
									className={`activity__dot${receipt.outcome === "success" ? "" : " activity__dot--err"}`}
								/>
								<span className="activity__meta">
									<span className="activity__title">{receipt.expenseTitle}</span>
									<span className="activity__sub">
										{receipt.payerName} · {receipt.payerPercent}% · {relativeTime(receipt.createdAt)}
									</span>
								</span>
								<span className="activity__amt num">{receipt.paidXlm} XLM</span>
							</>
						)

						return receipt.hash ? (
							<a
								key={receipt.id}
								className="activity__item"
								href={explorerTxUrl(receipt.hash)}
								target="_blank"
								rel="noreferrer"
							>
								{body}
							</a>
						) : (
							<div key={receipt.id} className="activity__item">
								{body}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
