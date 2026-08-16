import { useState } from "react"

import { addressColors, formatXlm, shortenAddress } from "../lib/money"
import { explorerAccountUrl, isValidAddress, loadNativeBalance } from "../lib/stellar"
import type { WalletState } from "../types"
import { ArrowUpRight, Power, Refresh, Shield, Wallet } from "../components/Icons"

interface Props {
	wallet: WalletState
	onConnect: () => void
	onDisconnect: () => void
}

type BalanceLookup =
	| { status: "idle"; message: null; stroops: null; funded: null }
	| { status: "loading"; message: string; stroops: null; funded: null }
	| { status: "success"; message: string; stroops: bigint; funded: true }
	| { status: "empty"; message: string; stroops: 0n; funded: false }
	| { status: "error"; message: string; stroops: null; funded: null }

const INITIAL_LOOKUP: BalanceLookup = { status: "idle", message: null, stroops: null, funded: null }

export function AccountPage({ wallet, onConnect, onDisconnect }: Props) {
	const connected = wallet.status === "connected" && wallet.address
	const colors = addressColors(wallet.address ?? "splitcare")
	const [lookupAddress, setLookupAddress] = useState("")
	const [lookup, setLookup] = useState<BalanceLookup>(INITIAL_LOOKUP)

	async function handleLookup() {
		const address = lookupAddress.trim()
		if (!isValidAddress(address)) {
			setLookup({ status: "error", message: "Enter a valid Stellar public key that starts with G.", stroops: null, funded: null })
			return
		}

		setLookup({ status: "loading", message: "Checking Stellar Testnet balance…", stroops: null, funded: null })
		try {
			const result = await loadNativeBalance(address)
			if (!result.funded) {
				setLookup({ status: "empty", message: "This account does not exist on Stellar Testnet yet.", stroops: 0n, funded: false })
				return
			}
			setLookup({ status: "success", message: "Balance found on Stellar Testnet.", stroops: result.stroops, funded: true })
		} catch {
			setLookup({ status: "error", message: "Could not read this Testnet account right now. Try again shortly.", stroops: null, funded: null })
		}
	}

	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Account</span>
				<h1 className="page__title">Wallet connection</h1>
				<p className="page__sub">
					SplitCare has no username, password, or profile. Freighter provides the wallet address used for this Testnet session.
				</p>
			</div>

			<div className="account-grid">
				<div className="card card--accent">
					<div className="card__head">
						<h3 className="card__title">Connected wallet</h3>
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
							<div className="balance">
								<span className="field__label">Connected balance</span>
								<span className="balance__value num">
									{wallet.loadingBalance ? "—" : formatXlm(wallet.balanceStroops ?? 0n)} XLM
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
									Disconnect locally
								</button>
							</div>
						</>
					) : (
						<div className="wallet-empty">
							<Wallet size={22} />
							<p>Connect Freighter to use the active Testnet wallet in your browser.</p>
							<button type="button" className="btn btn--primary btn--block" onClick={onConnect}>
								Connect wallet
							</button>
						</div>
					)}
				</div>

				<div className="card">
					<div className="card__head">
						<h3 className="card__title">How connection works</h3>
					</div>
					<ul className="info-list">
						<li>
							<Shield size={15} />
							<span>Your keys stay in Freighter. SplitCare only asks Freighter to sign a transaction.</span>
						</li>
						<li>
							<Shield size={15} />
							<span>SplitCare does not store an email, password, profile, or medical record.</span>
						</li>
						<li>
							<Shield size={15} />
							<span>Disconnecting clears this app's local state. To use another wallet, switch accounts or remove this site in Freighter.</span>
						</li>
					</ul>
				</div>
			</div>

			<div className="card">
				<div className="card__head">
					<h3 className="card__title">Testnet balance checker</h3>
				</div>
				<p className="field__hint">Paste any Stellar Testnet public key to verify that SplitCare can read balances beyond the connected wallet.</p>
				<label className="field">
					<span className="field__label">Public key</span>
					<input
						className="input input--mono"
						value={lookupAddress}
						onChange={(event) => {
							setLookupAddress(event.target.value.trim())
							setLookup(INITIAL_LOOKUP)
						}}
						placeholder="G..."
						spellCheck={false}
					/>
				</label>
				<div className="wallet-actions">
					<button type="button" className="btn btn--secondary" onClick={() => void handleLookup()} disabled={lookup.status === "loading"}>
						<Refresh size={14} />
						{lookup.status === "loading" ? "Checking" : "Check balance"}
					</button>
					{isValidAddress(lookupAddress) ? (
						<a className="linkbtn" href={explorerAccountUrl(lookupAddress)} target="_blank" rel="noreferrer">
							View on Stellar Expert
							<ArrowUpRight size={12} />
						</a>
					) : null}
				</div>
				{lookup.message ? (
					<div className={`banner ${lookup.status === "error" ? "banner--err" : lookup.status === "success" ? "banner--ok" : "banner--warn"}`}>
						<span>
							{lookup.message}
							{lookup.status === "success" ? ` Balance: ${formatXlm(lookup.stroops)} XLM.` : ""}
						</span>
					</div>
				) : null}
			</div>
		</div>
	)
}
