import { useCallback, useEffect, useRef, useState } from "react"

import { WalletError, connectWallet, readNetwork, restoreWallet } from "../lib/freighter"
import { fundWithFriendbot, loadNativeBalance } from "../lib/stellar"
import type { WalletState } from "../types"

const INITIAL: WalletState = {
	status: "unknown",
	address: null,
	networkLabel: null,
	onTestnet: false,
	balanceStroops: null,
	accountFunded: false,
	loadingBalance: false,
	error: null,
}

const MESSAGES = {
	notInstalled: "Freighter was not detected. Install the extension and reload this page.",
	cancelled: "Wallet connection was cancelled in Freighter.",
	wrongNetwork: "Switch Freighter to Stellar Testnet to continue.",
	balance: "We could not load your testnet XLM balance. Please try again.",
}

export function useWallet() {
	const [wallet, setWallet] = useState<WalletState>(INITIAL)
	const mounted = useRef(true)
	const addressRef = useRef<string | null>(null)

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	const loadBalance = useCallback(async (address: string) => {
		setWallet((current) => ({ ...current, loadingBalance: true }))
		try {
			const balance = await loadNativeBalance(address)
			if (!mounted.current) return
			setWallet((current) => ({
				...current,
				balanceStroops: balance.stroops,
				accountFunded: balance.funded,
				loadingBalance: false,
			}))
		} catch {
			if (!mounted.current) return
			setWallet((current) => ({ ...current, loadingBalance: false, error: MESSAGES.balance }))
		}
	}, [])

	const adopt = useCallback(
		async (address: string) => {
			addressRef.current = address
			const network = await readNetwork()
			if (!mounted.current) return

			setWallet((current) => ({
				...current,
				status: "connected",
				address,
				networkLabel: network.label,
				onTestnet: network.onTestnet,
				error: network.onTestnet ? null : MESSAGES.wrongNetwork,
			}))

			void loadBalance(address)
		},
		[loadBalance],
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const address = await restoreWallet()
				if (cancelled || !address) return
				await adopt(address)
			} catch {
				// Silent reconnect failures are not surfaced; the user can connect manually.
			}
		})()
		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const connect = useCallback(async () => {
		setWallet((current) => ({ ...current, status: "connecting", error: null }))
		try {
			const address = await connectWallet()
			await adopt(address)
		} catch (error) {
			const message =
				error instanceof WalletError
					? error.code === "rejected"
						? MESSAGES.cancelled
						: error.code === "not-installed"
							? MESSAGES.notInstalled
							: error.message
					: "Could not connect to Freighter."

			setWallet((current) => ({ ...current, status: "disconnected", error: message }))
		}
	}, [adopt])

	const disconnect = useCallback(() => {
		addressRef.current = null
		setWallet({ ...INITIAL, status: "disconnected" })
	}, [])

	const refresh = useCallback(async () => {
		if (addressRef.current) await loadBalance(addressRef.current)
	}, [loadBalance])

	const fundAccount = useCallback(async () => {
		if (!addressRef.current) return
		try {
			await fundWithFriendbot(addressRef.current)
			await loadBalance(addressRef.current)
		} catch (error) {
			setWallet((current) => ({
				...current,
				error: error instanceof Error ? error.message : "Friendbot funding failed.",
			}))
		}
	}, [loadBalance])

	const clearError = useCallback(() => {
		setWallet((current) => ({ ...current, error: null }))
	}, [])

	return { wallet, connect, disconnect, refresh, fundAccount, clearError }
}

export type UseWallet = ReturnType<typeof useWallet>
