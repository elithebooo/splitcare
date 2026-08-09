import { CreditCard, Gear, User } from "./Icons"

export type DashboardSection = "account" | "payments" | "settings"

interface Props {
	active: DashboardSection
	onNavigate: (section: DashboardSection) => void
}

const ITEMS: Array<{ id: DashboardSection; label: string; icon: (props: { size?: number }) => JSX.Element }> = [
	{ id: "account", label: "Account", icon: User },
	{ id: "payments", label: "Payments", icon: CreditCard },
	{ id: "settings", label: "Settings", icon: Gear },
]

export function DashboardNav({ active, onNavigate }: Props) {
	return (
		<nav className="dashnav" aria-label="Dashboard sections">
			<div className="dashnav__inner">
				{ITEMS.map((item) => {
					const Icon = item.icon
					const isActive = active === item.id
					return (
						<button
							key={item.id}
							type="button"
							className={`dashnav__item${isActive ? " dashnav__item--active" : ""}`}
							onClick={() => onNavigate(item.id)}
							aria-current={isActive ? "page" : undefined}
						>
							<Icon size={16} />
							{item.label}
						</button>
					)
				})}
			</div>
		</nav>
	)
}
