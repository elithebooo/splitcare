import { DashboardNav } from "../components/DashboardNav"
import type { DashboardSection } from "../components/DashboardNav"
import { Header } from "../components/Header"
import type { CareSplit } from "../hooks/useCareSplit"
import type { UseContractEvents } from "../hooks/useContractEvents"
import type { UseSettings } from "../hooks/useSettings"
import type { UseWallet } from "../hooks/useWallet"
import { AccountPage } from "./AccountPage"
import { ActivityPage } from "./ActivityPage"
import { PaymentsPage } from "./PaymentsPage"
import { SettingsPage } from "./SettingsPage"

interface Props {
	section: DashboardSection
	onNavigate: (path: string) => void
	careSplit: CareSplit
	wallet: UseWallet
	settings: UseSettings
	contractEvents: UseContractEvents
}

export function DashboardPage({ section, onNavigate, careSplit, wallet, settings, contractEvents }: Props) {
	// Wallet connection happens on the Payments page via the multi-wallet picker.
	const goToWalletPicker = () => onNavigate("/app/payments")

	return (
		<div className="app-shell">
			<Header
				wallet={wallet.wallet}
				currentPath={`/app/${section}`}
				onNavigate={onNavigate}
				onConnect={goToWalletPicker}
				onDisconnect={wallet.disconnect}
			/>

			<div className="app-shell__body">
				<DashboardNav active={section} onNavigate={(next) => onNavigate(`/app/${next}`)} />

				<main className="app-shell__main">
					{section === "account" ? (
						<AccountPage
							wallet={wallet.wallet}
							onConnect={goToWalletPicker}
							onDisconnect={wallet.disconnect}
						/>
					) : null}
					{section === "payments" ? (
						<PaymentsPage careSplit={careSplit} wallet={wallet} contractEvents={contractEvents} />
					) : null}
					{section === "activity" ? <ActivityPage contractEvents={contractEvents} /> : null}
					{section === "settings" ? (
						<SettingsPage
							settings={settings.settings}
							onSetTheme={settings.setTheme}
							onSetPrecision={settings.setPrecision}
							onSetNotifications={settings.setNotifications}
							onReset={settings.resetSettings}
						/>
					) : null}
				</main>
			</div>

			<footer className="footer footer--app">
				<div className="footer__inner">
					<span>SplitCare · Stellar Testnet demo. Test XLM only. Never real funds.</span>
				</div>
			</footer>
		</div>
	)
}
