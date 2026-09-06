import { explorerTxUrl } from "../lib/stellar"
import type { TxStage, TxStatus } from "../types"
import { Alert, ArrowUpRight } from "./Icons"

interface Props {
	status: TxStatus
	title?: string
}

const ORDER: TxStage[] = ["preparing", "awaiting-signature", "submitting", "pending", "success"]

const STEPS: Array<{ stage: TxStage; label: string }> = [
	{ stage: "preparing", label: "Preparing contract call" },
	{ stage: "awaiting-signature", label: "Awaiting wallet signature" },
	{ stage: "submitting", label: "Submitting to Soroban RPC" },
	{ stage: "pending", label: "Pending on Testnet" },
	{ stage: "success", label: "Confirmed on-chain" },
]

const STAGE_CHIP: Record<TxStage, string> = {
	idle: "Idle",
	preparing: "Preparing",
	"awaiting-signature": "Signature",
	submitting: "Submitting",
	pending: "Pending",
	success: "Success",
	failed: "Failed",
	rejected: "Rejected",
}

function activeIndex(status: TxStatus): number {
	if (status.stage === "failed" || status.stage === "rejected") {
		// If a hash exists we at least reached the pending stage.
		return status.hash ? ORDER.indexOf("pending") : ORDER.indexOf("awaiting-signature")
	}
	return ORDER.indexOf(status.stage)
}

/** Visible lifecycle tracker for Soroban contract transactions. */
export function TxStatusCard({ status, title }: Props) {
	if (status.stage === "idle") return null

	const current = activeIndex(status)
	const broken = status.stage === "failed" || status.stage === "rejected"

	return (
		<div className={`card txstatus txstatus--${status.stage}`}>
			<div className="card__head">
				<h3 className="card__title">{title ?? "Contract transaction"}</h3>
				<span className={`txchip txchip--${status.stage}`}>{STAGE_CHIP[status.stage]}</span>
			</div>

			<ol className="txsteps">
				{STEPS.map((step, index) => {
					const state =
						index < current
							? "is-done"
							: index === current
								? broken
									? "is-failed"
									: status.stage === "success"
										? "is-done"
										: "is-active"
								: ""
					return (
						<li key={step.stage} className={state || undefined}>
							{step.label}
						</li>
					)
				})}
			</ol>

			{status.error ? (
				<div className="banner banner--err" style={{ marginTop: 10 }}>
					<Alert size={14} />
					<span>{status.error}</span>
				</div>
			) : null}

			{status.hash ? (
				<a
					className="linkbtn txstatus__hash"
					href={explorerTxUrl(status.hash)}
					target="_blank"
					rel="noreferrer"
				>
					View contract transaction on Stellar Expert
					<ArrowUpRight size={12} />
				</a>
			) : null}
		</div>
	)
}
