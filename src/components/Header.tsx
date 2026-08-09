import { shortenAddress } from "../lib/money"
import type { WalletState } from "../types"
import { BrandMark, CreditCard, HomeIcon, Power } from "./Icons"

interface Props {
	wallet: WalletState
	currentPath: string
	onNavigate: (path: string) => void
	onConnect: () => void
	onDisconnect: () => void
}

export function Header({ wallet, currentPath, onNavigate, onConnect, onDisconnect }: Props) {
	const connected = wallet.status === "connected" && wallet.address
	const wrongNetwork = connected && !wallet.onTestnet

	return (
		<header className="header">
			<div className="header__inner">
				<a
					className="brand"
					href="#/"
					onClick={(event) => {
						event.preventDefault()
						onNavigate("/")
					}}
				>
					<BrandMark size={22} />
					<span className="brand__name">SplitCare</span>
				</a>

				<nav className="topnav" aria-label="Primary">
					<a
						className={`topnav__link${currentPath === "/" ? " topnav__link--active" : ""}`}
						href="#/"
						onClick={(event) => {
							event.preventDefault()
							onNavigate("/")
						}}
					>
						<HomeIcon size={15} />
						Home
					</a>
					<a
						className={`topnav__link${currentPath === "/app/payments" ? " topnav__link--active" : ""}`}
						href="#/app/payments"
						onClick={(event) => {
							event.preventDefault()
							onNavigate("/app/payments")
						}}
					>
						<CreditCard size={15} />
						Payments
					</a>
				</nav>

				<span className={`chip chip--network${wrongNetwork ? " chip--warn" : ""}`}>
					<span className="chip__dot" />
					{wrongNetwork ? "Wrong network" : "Testnet"}
				</span>

				{connected ? (
					<button type="button" className="wallet-pill" onClick={onDisconnect} title="Disconnect">
						<span className="wallet-pill__addr">{shortenAddress(wallet.address ?? "")}</span>
						<Power size={14} />
					</button>
				) : (
					<button type="button" className="btn btn--primary btn--sm" onClick={onConnect}>
						Connect wallet
					</button>
				)}
			</div>

			<div className="header__notice">
				Testnet demo. SplitCare moves test XLM only. No real money, no medical records, and no data leaves your browser.
			</div>
		</header>
	)
}
