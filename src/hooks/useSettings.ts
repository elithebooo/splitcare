import { useCallback, useEffect, useState } from "react"

import type { PrecisionPreference, SettingsState, ThemePreference } from "../types"

const STORAGE_KEY = "splitcare:settings"

const DEFAULTS: SettingsState = {
	theme: "system",
	precision: "compact",
	notifications: false,
}

function readStoredSettings(): SettingsState {
	if (typeof window === "undefined") return DEFAULTS
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (!raw) return DEFAULTS
		const parsed = JSON.parse(raw) as Partial<SettingsState>
		return { ...DEFAULTS, ...parsed }
	} catch {
		return DEFAULTS
	}
}

/** Local, device-only preferences: appearance, amount precision, and payment notifications. */
export function useSettings() {
	const [settings, setSettings] = useState<SettingsState>(readStoredSettings)

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
		} catch {
			// Storage may be unavailable (private mode); settings simply won't persist.
		}
	}, [settings])

	useEffect(() => {
		const root = document.documentElement
		if (settings.theme === "system") {
			root.removeAttribute("data-theme")
		} else {
			root.setAttribute("data-theme", settings.theme)
		}
	}, [settings.theme])

	const setTheme = useCallback((theme: ThemePreference) => {
		setSettings((current) => ({ ...current, theme }))
	}, [])

	const setPrecision = useCallback((precision: PrecisionPreference) => {
		setSettings((current) => ({ ...current, precision }))
	}, [])

	const setNotifications = useCallback((notifications: boolean) => {
		setSettings((current) => ({ ...current, notifications }))
	}, [])

	const resetSettings = useCallback(() => {
		setSettings(DEFAULTS)
	}, [])

	return { settings, setTheme, setPrecision, setNotifications, resetSettings }
}
