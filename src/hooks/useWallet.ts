import { useCallback, useEffect, useRef, useState } from "react"

import { toAppError } from "../lib/errors"
import {
	connectWallet,
	disconnectWallet,
	listWallets,
	readWalletNetwork,
	restoreWallet,
	signWithWallet,
} from "../lib/walletKit"
import { fundWithFriendbot, loadNativeBalance } from "../lib/stellar"
import type { WalletOption, WalletProvider, WalletState } from "../types"

const INITIAL: WalletState = {
	status: "unknown",
	address: null,
	provider: null,
	networkLabel: null,
	onTestnet: false,
	balanceStroops: null,
	accountFunded: false,
	loadingBalance: false,
	error: null,
	errorCode: null,
}

const BALANCE_ERROR = "We could not load your testnet XLM balance. Please try again."

/**
 * Multi-wallet state powered by StellarWalletsKit.
 * `connect(walletId)` connects to one specific wallet from the picker.
 */
export function useWallet() {
	const [wallet, setWallet] = useState<WalletState>(INITIAL)
	const [wallets, setWallets] = useState<WalletOption[]>([])
	const [walletsLoading, setWalletsLoading] = useState(true)
	const [connectingId, setConnectingId] = useState<string | null>(null)

	const mounted = useRef(true)
	const addressRef = useRef<string | null>(null)

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	// Detect supported wallets once on mount (for the wallet picker UI).
	useEffect(() => {
		let cancelled = false
		void listWallets().then((options) => {
			if (cancelled) return
			setWallets(options)
			setWalletsLoading(false)
		})
		return () => {
			cancelled = true
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
			setWallet((current) => ({ ...current, loadingBalance: false, error: BALANCE_ERROR }))
		}
	}, [])

	const adopt = useCallback(
		async (address: string, provider: WalletProvider) => {
			addressRef.current = address
			const network = await readWalletNetwork()
			if (!mounted.current) return

			setWallet((current) => ({
				...current,
				status: "connected",
				address,
				provider,
				networkLabel: network.label,
				onTestnet: network.onTestnet,
				error: network.onTestnet ? null : "Switch your wallet to Stellar Testnet to continue.",
				errorCode: network.onTestnet ? null : "wrong-network",
			}))

			void loadBalance(address)
		},
		[loadBalance],
	)

	// Silently restore the previously used wallet, if the user approved it before.
	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const restored = await restoreWallet()
				if (cancelled || !restored) return
				await adopt(restored.address, restored.provider)
			} catch {
				// Silent reconnect failures are fine; the user can connect manually.
			}
		})()
		return () => {
			cancelled = true
		}
	}, [adopt])

	const connect = useCallback(
		async (walletId: string) => {
			setConnectingId(walletId)
			setWallet((current) => ({ ...current, status: "connecting", error: null, errorCode: null }))
			try {
				const { address, provider } = await connectWallet(walletId)
				await adopt(address, provider)
			} catch (error) {
				const appError = toAppError(error, "Could not connect to the wallet.")
				if (!mounted.current) return
				setWallet((current) => ({
					...current,
					status: "disconnected",
					error: appError.message,
					errorCode: appError.code,
				}))
			} finally {
				if (mounted.current) setConnectingId(null)
			}
		},
		[adopt],
	)

	const disconnect = useCallback(() => {
		addressRef.current = null
		void disconnectWallet()
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
		setWallet((current) => ({ ...current, error: null, errorCode: null }))
	}, [])

	const sign = useCallback((xdr: string, address: string) => signWithWallet(xdr, address), [])

	return {
		wallet,
		wallets,
		walletsLoading,
		connectingId,
		connect,
		disconnect,
		refresh,
		fundAccount,
		clearError,
		sign,
	}
}

export type UseWallet = ReturnType<typeof useWallet>
