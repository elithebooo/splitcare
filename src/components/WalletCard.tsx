import { addressColors, formatXlm, shortenAddress } from "../lib/money"
import { explorerAccountUrl } from "../lib/stellar"
import type { WalletState } from "../types"
import { Alert, ArrowUpRight, Copy, Power, Refresh, Wallet } from "./Icons"

interface Props {
	wallet: WalletState
	onConnect: () => void
	onDisconnect: () => void
	onRefresh: () => void
	onFund: () => void
}

export function WalletCard({ wallet, onConnect, onDisconnect, onRefresh, onFund }: Props) {
	const connected = wallet.status === "connected" && wallet.address

	if (!connected) {
		return (
			<div className="card card--accent">
				<div className="card__head">
					<h3 className="card__title">Wallet</h3>
				</div>
				<div className="wallet-empty">
					<Wallet size={22} />
					<p>Connect Freighter on Stellar Testnet to see your balance and pay your share.</p>
					<button
						type="button"
						className="btn btn--primary btn--block"
						onClick={onConnect}
						disabled={wallet.status === "connecting"}
					>
						{wallet.status === "connecting" ? "Connecting…" : "Connect wallet"}
					</button>
					{wallet.error ? (
						<div className="banner banner--warn">
							<Alert size={14} />
							<span>{wallet.error}</span>
						</div>
					) : null}
					{wallet.error?.includes("not detected") ? (
						<a
							className="linkbtn"
							href="https://www.freighter.app/"
							target="_blank"
							rel="noreferrer"
						>
							Get Freighter
							<ArrowUpRight size={12} />
						</a>
					) : null}
				</div>
			</div>
		)
	}

	const colors = addressColors(wallet.address ?? "")

	return (
		<div className="card card--accent">
			<div className="card__head">
				<h3 className="card__title">Wallet</h3>
				<button type="button" className="iconbtn" onClick={onDisconnect} aria-label="Disconnect" title="Disconnect">
					<Power size={14} />
				</button>
			</div>

			<div className="wallet-row">
				<span
					className="wallet-row__avatar"
					style={{ background: `linear-gradient(135deg, ${colors.a}, ${colors.b})` }}
				/>
				<span className="wallet-row__meta">
					<span className="wallet-row__addr mono">{shortenAddress(wallet.address ?? "", 6, 6)}</span>
					<span className="wallet-row__sub">{wallet.networkLabel ?? "Stellar Testnet"}</span>
				</span>
			</div>

			<div className="balance">
				<span className="field__label">Testnet balance</span>
				<span className="balance__value num">
					{wallet.loadingBalance ? "—" : formatXlm(wallet.balanceStroops ?? 0n)} XLM
				</span>
			</div>

			{!wallet.accountFunded ? (
				<div className="banner banner--warn">
					<Alert size={14} />
					<span>This account is not funded on Testnet yet.</span>
				</div>
			) : null}

			{wallet.error ? (
				<div className="banner banner--warn">
					<Alert size={14} />
					<span>{wallet.error}</span>
				</div>
			) : null}

			<div className="wallet-actions">
				{!wallet.accountFunded ? (
					<button type="button" className="btn btn--secondary btn--sm" onClick={onFund}>
						Fund with Friendbot
					</button>
				) : null}
				<button type="button" className="btn btn--quiet btn--sm" onClick={onRefresh}>
					<Refresh size={13} />
					Refresh
				</button>
				<a
					className="linkbtn"
					href={explorerAccountUrl(wallet.address ?? "")}
					target="_blank"
					rel="noreferrer"
				>
					View account
					<ArrowUpRight size={12} />
				</a>
			</div>
		</div>
	)
}
