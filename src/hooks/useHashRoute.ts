import { useCallback, useEffect, useState } from "react"

function readHash(): string {
	const raw = window.location.hash.replace(/^#/, "")
	return raw === "" ? "/" : raw
}

/** Minimal hash-based router. No external dependency, no page reloads. */
export function useHashRoute(): [string, (path: string) => void] {
	const [path, setPath] = useState<string>(readHash)

	useEffect(() => {
		function onHashChange() {
			setPath(readHash())
		}
		window.addEventListener("hashchange", onHashChange)
		return () => window.removeEventListener("hashchange", onHashChange)
	}, [])

	const navigate = useCallback((next: string) => {
		const current = window.location.hash.replace(/^#/, "")
		if (current === next) {
			setPath(next === "" ? "/" : next)
			return
		}
		window.location.hash = next
	}, [])

	return [path, navigate]
}
