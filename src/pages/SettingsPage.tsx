import type { PrecisionPreference, SettingsState, ThemePreference } from "../types"
import { Bolt, Laptop, Moon, Refresh, Sun } from "../components/Icons"

interface Props {
	settings: SettingsState
	onSetTheme: (theme: ThemePreference) => void
	onSetPrecision: (precision: PrecisionPreference) => void
	onSetNotifications: (value: boolean) => void
	onReset: () => void
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Laptop },
]

export function SettingsPage({ settings, onSetTheme, onSetPrecision, onSetNotifications, onReset }: Props) {
	return (
		<div className="page">
			<div className="page__head">
				<span className="eyebrow">Settings</span>
				<h1 className="page__title">Preferences</h1>
				<p className="page__sub">Stored only in this browser. SplitCare has no account to sync them to.</p>
			</div>

			<div className="settings-list">
				<section className="settings-row">
					<div className="settings-row__meta">
						<h3>Appearance</h3>
						<p>Choose how SplitCare looks on this device.</p>
					</div>
					<div className="segmented">
						{THEME_OPTIONS.map((option) => {
							const Icon = option.icon
							const active = settings.theme === option.value
							return (
								<button
									key={option.value}
									type="button"
									className={`segmented__item${active ? " segmented__item--active" : ""}`}
									onClick={() => onSetTheme(option.value)}
									aria-pressed={active}
								>
									<Icon size={14} />
									{option.label}
								</button>
							)
						})}
					</div>
				</section>

				<section className="settings-row">
					<div className="settings-row__meta">
						<h3>Amount precision</h3>
						<p>Compact rounds to 2 decimals; full shows exact stroop-level amounts.</p>
					</div>
					<div className="segmented">
						<button
							type="button"
							className={`segmented__item${settings.precision === "compact" ? " segmented__item--active" : ""}`}
							onClick={() => onSetPrecision("compact")}
							aria-pressed={settings.precision === "compact"}
						>
							Compact
						</button>
						<button
							type="button"
							className={`segmented__item${settings.precision === "full" ? " segmented__item--active" : ""}`}
							onClick={() => onSetPrecision("full")}
							aria-pressed={settings.precision === "full"}
						>
							Full
						</button>
					</div>
				</section>

				<section className="settings-row">
					<div className="settings-row__meta">
						<h3>Payment notifications</h3>
						<p>Show a browser notification when a payment finishes submitting.</p>
					</div>
					<button
						type="button"
						className={`switch${settings.notifications ? " switch--on" : ""}`}
						role="switch"
						aria-checked={settings.notifications}
						onClick={() => onSetNotifications(!settings.notifications)}
					>
						<span className="switch__thumb" />
					</button>
				</section>

				<section className="settings-row">
					<div className="settings-row__meta">
						<h3>Reset preferences</h3>
						<p>Return appearance, precision and notification settings to their defaults.</p>
					</div>
					<button type="button" className="btn btn--quiet btn--sm" onClick={onReset}>
						<Refresh size={13} />
						Reset to defaults
					</button>
				</section>

				<section className="settings-row settings-row--static">
					<div className="settings-row__meta">
						<h3>Network</h3>
						<p>SplitCare only ever runs on Stellar Testnet. There is nothing to configure here.</p>
					</div>
					<span className="chip chip--network">
						<Bolt size={12} />
						Testnet
					</span>
				</section>
			</div>
		</div>
	)
}
