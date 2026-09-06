import type { WalletOption } from "../types"
import { Wallet } from "./Icons"

interface Props {
	wallets: WalletOption[]
	loading: boolean
	connectingId: string | null
	onSelect: (walletId: string) => void
}

/**
 * Wallet picker backed by StellarWalletsKit.
 * Every supported wallet is listed; wallets that are not installed are shown
 * as "Not installed" so the not-found state is visible and testable.
 */
export function WalletOptions({ wallets, loading, connectingId, onSelect }: Props) {
	if (loading) {
		return <p className="fineprint">Detecting Stellar wallets…</p>
	}

	if (wallets.length === 0) {
		return (
			<p className="fineprint">
				No Stellar wallets were found. Install Freighter, xBull, Albedo, Rabet, Lobstr, or
				Hana, then reload this page.
			</p>
		)
	}

	return (
		<div className="wallet-options" role="list" aria-label="Available Stellar wallets">
			{wallets.map((wallet) => (
				<button
					key={wallet.id}
					type="button"
					role="listitem"
					className="wallet-option"
					disabled={connectingId !== null}
					onClick={() => onSelect(wallet.id)}
				>
					{wallet.icon ? (
						<img className="wallet-option__icon" src={wallet.icon} alt="" aria-hidden="true" />
					) : (
						<span className="wallet-option__icon wallet-option__icon--fallback" aria-hidden="true">
							<Wallet size={16} />
						</span>
					)}
					<span className="wallet-option__meta">
						<span className="wallet-option__name">{wallet.name}</span>
						<span
							className={`wallet-option__state${wallet.isAvailable ? " wallet-option__state--ok" : ""}`}
						>
							{wallet.isAvailable ? "Detected" : "Not installed"}
						</span>
					</span>
					{connectingId === wallet.id ? <span className="spinner" aria-hidden="true" /> : null}
				</button>
			))}
		</div>
	)
}
