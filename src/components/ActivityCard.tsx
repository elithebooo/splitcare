import { explorerTxUrl } from "../lib/stellar"
import type { ContractEventInfo, Receipt } from "../types"

interface Props {
	receipts: Receipt[]
	/** Live contract events streamed from Soroban RPC. */
	liveEvents?: ContractEventInfo[]
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

export function ActivityCard({ receipts, liveEvents, onClear }: Props) {
	const recentEvents = liveEvents ? [...liveEvents].slice(-8).reverse() : []

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
					Payments you make in this tab show up here with their transaction hash. Nothing is
					stored after you close the page.
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

			{recentEvents.length > 0 ? (
				<>
					<div className="card__head" style={{ marginTop: 16 }}>
						<h3 className="card__title">Live contract events</h3>
						<span className="livedot" title="Synced from the contract" aria-hidden="true" />
					</div>
					<div className="activity">
						{recentEvents.map((event) => {
							const body = (
								<>
									<span
										className="activity__dot"
										style={{ background: event.kind === "paid" ? "#16a34a" : "var(--accent, #6366f1)" }}
									/>
									<span className="activity__meta">
										<span className="activity__title">{event.summary}</span>
										<span className="activity__sub">
											ledger {event.ledger}
											{event.closedAt ? ` · ${relativeTime(event.closedAt)}` : ""}
										</span>
									</span>
								</>
							)

							return event.txHash ? (
								<a
									key={event.id}
									className="activity__item"
									href={explorerTxUrl(event.txHash)}
									target="_blank"
									rel="noreferrer"
								>
									{body}
								</a>
							) : (
								<div key={event.id} className="activity__item">
									{body}
								</div>
							)
						})}
					</div>
				</>
			) : null}
		</div>
	)
}
