import type { DashboardSection } from "./components/DashboardNav"
import { useCareSplit } from "./hooks/useCareSplit"
import { useContractEvents } from "./hooks/useContractEvents"
import { useHashRoute } from "./hooks/useHashRoute"
import { useSettings } from "./hooks/useSettings"
import { useWallet } from "./hooks/useWallet"
import { DashboardPage } from "./pages/DashboardPage"
import { LandingPage } from "./pages/LandingPage"

const SECTIONS: DashboardSection[] = ["account", "payments", "activity", "settings"]

function resolveSection(path: string): DashboardSection {
	const tail = path.replace(/^\/app\/?/, "") as DashboardSection
	return SECTIONS.includes(tail) ? tail : "payments"
}

export default function App() {
	const [path, navigate] = useHashRoute()
	const wallet = useWallet()
	const careSplit = useCareSplit()
	const settings = useSettings()

	const isDashboard = path.startsWith("/app")
	// Stream contract events while the dashboard is open (near real-time sync).
	const contractEvents = useContractEvents(isDashboard)

	if (!isDashboard) {
		return <LandingPage onGetStarted={() => navigate("/app/payments")} />
	}

	return (
		<DashboardPage
			section={resolveSection(path)}
			onNavigate={navigate}
			careSplit={careSplit}
			wallet={wallet}
			settings={settings}
			contractEvents={contractEvents}
		/>
	)
}
