import { useMemo } from "react"

import { LiveExpenses } from "../components/LiveExpenses"
import { ArrowUpRight } from "../components/Icons"
import { CONTRACT_ENABLED, CONTRACT_ID } from "../config"
import type { UseContractEvents } from "../hooks/useContractEvents"
import { buildFeed } from "../lib/contract"
import { explorerContractUrl } from "../lib/stellar"

interface Props {
	contractEvents: UseContractEvents
}

/** Live dashboard rebuilt from SplitCare contract events. */
export function ActivityPage({ contractEvents }: Props) {
	const feed = useMemo(() => buildFeed(contractEvents.events), [contractEvents.events])

	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Activity</span>
				<h1 className="page__title">Live contract activity</h1>
				<p className="page__sub">
					Expenses and share payments stream in from the SplitCare Soroban contract as events.
				</p>
			</div>

			<div className="layout">
				<div className="layout__main">
					<LiveExpenses
						expenses={feed}
						syncing={contractEvents.syncing}
						latestLedger={contractEvents.latestLedger}
						enabled={contractEvents.enabled}
						error={contractEvents.error}
						onRefresh={() => void contractEvents.refresh()}
					/>
				</div>

				<aside className="layout__side">
					<div className="card">
						<div className="card__head">
							<h3 className="card__title">How live sync works</h3>
						</div>
						<p className="fineprint">
							The contract emits <code>splitcare / created</code> and <code>splitcare / paid</code>{" "}
							events. This page polls Soroban RPC every few seconds and rebuilds expense state
							from those events — no manual refresh needed.
						</p>
						{CONTRACT_ENABLED ? (
							<>
								<p className="fineprint mono" style={{ wordBreak: "break-all" }}>
									Contract: {CONTRACT_ID}
								</p>
								<a
									className="linkbtn"
									href={explorerContractUrl(CONTRACT_ID)}
									target="_blank"
									rel="noreferrer"
								>
									View contract on Stellar Expert
									<ArrowUpRight size={12} />
								</a>
							</>
						) : (
							<p className="fineprint">
								The contract id is not configured yet. Deploy the contract with
								scripts/deploy-contract.sh and set VITE_CONTRACT_ID.
							</p>
						)}
					</div>
				</aside>
			</div>
		</div>
	)
}
