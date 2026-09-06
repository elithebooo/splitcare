import { useCallback, useEffect, useRef, useState } from "react"

import { CONTRACT_ENABLED } from "../config"
import { fetchContractEvents } from "../lib/contract"
import { errorMessage } from "../lib/errors"
import type { ContractEventInfo } from "../types"

const POLL_INTERVAL_MS = 5_000
const MAX_EVENTS_KEPT = 300

/**
 * Streams SplitCare contract events from Soroban RPC.
 *
 * The first poll reads a recent ledger window; every later poll only asks for
 * events after the last seen cursor, so the UI stays in sync in near
 * real-time without a manual refresh.
 */
export function useContractEvents(enabled: boolean) {
	const [events, setEvents] = useState<ContractEventInfo[]>([])
	const [latestLedger, setLatestLedger] = useState<number | null>(null)
	const [syncing, setSyncing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const cursorRef = useRef<string | null>(null)
	const seenRef = useRef<Set<string>>(new Set())
	const inFlightRef = useRef(false)

	const poll = useCallback(async () => {
		if (!CONTRACT_ENABLED || inFlightRef.current) return
		inFlightRef.current = true
		setSyncing(true)
		try {
			const page = await fetchContractEvents({ cursor: cursorRef.current })
			setLatestLedger(page.latestLedger)
			cursorRef.current = page.cursor

			const fresh = page.events.filter((event) => !seenRef.current.has(event.id))
			if (fresh.length > 0) {
				for (const event of fresh) seenRef.current.add(event.id)
				setEvents((current) => [...current, ...fresh].slice(-MAX_EVENTS_KEPT))
			}
			setError(null)
		} catch (cause) {
			setError(errorMessage(cause, "Could not sync contract events right now."))
		} finally {
			inFlightRef.current = false
			setSyncing(false)
		}
	}, [])

	useEffect(() => {
		if (!enabled || !CONTRACT_ENABLED) return
		void poll()
		const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
		return () => window.clearInterval(interval)
	}, [enabled, poll])

	return {
		events,
		latestLedger,
		syncing,
		error,
		refresh: poll,
		enabled: CONTRACT_ENABLED,
	}
}

export type UseContractEvents = ReturnType<typeof useContractEvents>
