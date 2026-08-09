import { addressColors, shortenAddress } from "../lib/money"
import { explorerAccountUrl } from "../lib/stellar"
import type { WalletState } from "../types"
import { ArrowUpRight, Power, Shield, Wallet } from "../components/Icons"

interface Props {
	wallet: WalletState
	onConnect: () => void
	onDisconnect: () => void
}

export function AccountPage({ wallet, onConnect, onDisconnect }: Props) {
	const connected = wallet.status === "connected" && wallet.address
	const colors = addressColors(wallet.address ?? "splitcare")

	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Account</span>
				<h1 className="page__title">Your login &amp; identity</h1>
				<p className="page__sub">
					SplitCare has no separate account system. Your Freighter wallet is your login on Stellar
					Testnet.
				</p>
			</div>

			<div className="account-grid">
				<div className="card card--accent">
					<div className="card__head">
						<h3 className="card__title">Signed-in wallet</h3>
					</div>

					{connected ? (
						<>
							<div className="wallet-row">
								<span
									className="wallet-row__avatar wallet-row__avatar--lg"
									style={{ background: `linear-gradient(135deg, ${colors.a}, ${colors.b})` }}
								/>
								<span className="wallet-row__meta">
									<span className="wallet-row__addr mono">{shortenAddress(wallet.address ?? "", 8, 8)}</span>
									<span className="wallet-row__sub">{wallet.networkLabel ?? "Stellar Testnet"}</span>
								</span>
							</div>
							<div className="wallet-actions">
								<a
									className="linkbtn"
									href={explorerAccountUrl(wallet.address ?? "")}
									target="_blank"
									rel="noreferrer"
								>
									View account
									<ArrowUpRight size={12} />
								</a>
								<button type="button" className="btn btn--quiet btn--sm" onClick={onDisconnect}>
									<Power size={13} />
									Disconnect
								</button>
							</div>
						</>
					) : (
						<div className="wallet-empty">
							<Wallet size={22} />
							<p>You're not connected yet. Connect Freighter to sign in with your Testnet wallet.</p>
							<button type="button" className="btn btn--primary btn--block" onClick={onConnect}>
								Connect wallet
							</button>
						</div>
					)}
				</div>

				<div className="card">
					<div className="card__head">
						<h3 className="card__title">How sign-in works</h3>
					</div>
					<ul className="info-list">
						<li>
							<Shield size={15} />
							<span>Your keys never leave Freighter. SplitCare only ever requests a signature.</span>
						</li>
						<li>
							<Shield size={15} />
							<span>There is no password, email, or profile stored anywhere by SplitCare.</span>
						</li>
						<li>
							<Shield size={15} />
							<span>Disconnecting simply forgets the wallet for this browser tab.</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	)
}
