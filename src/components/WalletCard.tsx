import { useState } from "react"

import { addressColors, formatXlm, shortenAddress } from "../lib/money"
import { explorerAccountUrl } from "../lib/stellar"
import type { WalletOption, WalletState } from "../types"
import { Alert, ArrowUpRight, Power, Refresh, Wallet } from "./Icons"
import { WalletOptions } from "./WalletOptions"

interface Props {
	wallet: WalletState
	wallets: WalletOption[]
	walletsLoading: boolean
	connectingId: string | null
	onConnect: (walletId: string) => void
	onDisconnect: () => void
	onRefresh: () => void
	onFund: () => void
}

export function WalletCard({
	wallet,
	wallets,
	walletsLoading,
	connectingId,
	onConnect,
	onDisconnect,
	onRefresh,
	onFund,
}: Props) {
	const [pickerOpen, setPickerOpen] = useState(false)
	const connected = wallet.status === "connected" && wallet.address

	if (!connected) {
		return (
			<div className="card card--accent">
				<div className="card__head">
					<h3 className="card__title">Wallet</h3>
				</div>
				<div className="wallet-empty">
					<Wallet size={22} />
					<p>
						Connect a Stellar wallet on Testnet to pay your share. Any wallet supported by
						StellarWalletsKit works.
					</p>
					<button
						type="button"
						className="btn btn--primary btn--block"
						onClick={() => setPickerOpen((open) => !open)}
						aria-expanded={pickerOpen}
					>
						{pickerOpen ? "Hide wallet list" : "Connect wallet"}
					</button>
					{pickerOpen ? (
						<WalletOptions
							wallets={wallets}
							loading={walletsLoading}
							connectingId={connectingId}
							onSelect={onConnect}
						/>
					) : null}
					{wallet.error ? (
						<div className="banner banner--warn">
							<Alert size={14} />
							<span>{wallet.error}</span>
						</div>
					) : null}
					{wallet.errorCode === "wallet-not-found" ? (
						<a
							className="linkbtn"
							href="https://docs.freighter.app/"
							target="_blank"
							rel="noreferrer"
						>
							Get a Stellar wallet
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
				<button
					type="button"
					className="iconbtn"
					onClick={onDisconnect}
					aria-label="Disconnect locally"
					title="Disconnect locally"
				>
					<Power size={14} />
				</button>
			</div>

			{wallet.provider ? (
				<span className="wallet-provider" title={`Connected via ${wallet.provider.name}`}>
					{wallet.provider.icon ? <img src={wallet.provider.icon} alt="" aria-hidden="true" /> : null}
					{wallet.provider.name}
				</span>
			) : null}

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

			<p className="fineprint">
				Disconnect clears SplitCare only. Your wallet keeps site permissions until you remove
				them there.
			</p>

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
