import {
	StellarWalletsKit,
	WalletNetwork,
	allowAllModules,
} from "@creit-tech/stellar-wallets-kit"
import { Networks } from "@stellar/stellar-sdk"

import { AppError, toAppError } from "./errors"
import type { WalletOption, WalletProvider } from "../types"

/**
 * Multi-wallet support through StellarWalletsKit.
 * All supported wallets (Freighter, xBull, Albedo, Rabet, Lobstr, Hana, ...)
 * are listed; wallets that are not installed are reported as unavailable so
 * the UI can surface a proper "wallet not found" state.
 */

const STORAGE_KEY = "splitcare:wallet-id"

let kit: StellarWalletsKit | null = null

export function getKit(): StellarWalletsKit {
	if (!kit) {
		kit = new StellarWalletsKit({
			network: WalletNetwork.TESTNET,
			modules: allowAllModules(),
		})
	}
	return kit
}

interface RawSupportedWallet {
	id: string
	name?: string
	shortName?: string
	icon?: string
	url?: string
	isAvailable?: boolean
}

function normalizeWallet(raw: RawSupportedWallet): WalletOption {
	return {
		id: raw.id,
		name: raw.name ?? raw.shortName ?? raw.id,
		icon: raw.icon ?? "",
		url: raw.url ?? "",
		isAvailable: Boolean(raw.isAvailable),
	}
}

/** Lists every wallet supported by the kit, with install detection. */
export async function listWallets(): Promise<WalletOption[]> {
	try {
		const supported = (await getKit().getSupportedWallets()) as unknown as RawSupportedWallet[]
		return supported.map(normalizeWallet)
	} catch {
		return []
	}
}

export function rememberedWalletId(): string | null {
	try {
		return window.localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

function rememberWallet(id: string | null): void {
	try {
		if (id) window.localStorage.setItem(STORAGE_KEY, id)
		else window.localStorage.removeItem(STORAGE_KEY)
	} catch {
		// storage may be unavailable (private mode); connection just won't persist
	}
}

export interface ConnectedWallet {
	address: string
	provider: WalletProvider
}

/** Connects to a specific wallet by id. Throws AppError with a stable code. */
export async function connectWallet(walletId: string): Promise<ConnectedWallet> {
	const wallets = await listWallets()
	const chosen = wallets.find((wallet) => wallet.id === walletId)

	if (!chosen) {
		throw new AppError("wallet-not-found", "That wallet is not supported by StellarWalletsKit.")
	}
	if (!chosen.isAvailable) {
		throw new AppError(
			"wallet-not-found",
			`${chosen.name} was not detected in this browser. Install the extension and try again.`,
		)
	}

	const instance = getKit()
	instance.setWallet(walletId)

	try {
		const { address } = await instance.getAddress()
		rememberWallet(walletId)
		return { address, provider: chosen }
	} catch (error) {
		throw toAppError(error, `Could not connect to ${chosen.name}.`)
	}
}

/** Silently restores the previously selected wallet, if any. */
export async function restoreWallet(): Promise<ConnectedWallet | null> {
	const id = rememberedWalletId()
	if (!id) return null
	try {
		return await connectWallet(id)
	} catch {
		rememberWallet(null)
		return null
	}
}

export async function disconnectWallet(): Promise<void> {
	rememberWallet(null)
	try {
		await getKit().disconnect()
	} catch {
		// disconnect is best-effort; local state is already cleared
	}
}

export interface WalletNetworkInfo {
	label: string
	onTestnet: boolean
}

/**
 * Reads the wallet's network. Some wallets cannot report it; those are
 * treated as compatible so the demo stays usable.
 */
export async function readWalletNetwork(): Promise<WalletNetworkInfo> {
	try {
		const result = (await getKit().getNetwork()) as unknown
		const label =
			typeof result === "string"
				? result
				: ((result as { network?: string })?.network ?? "")
		return { label: label || "Unknown", onTestnet: /testnet/i.test(label) }
	} catch {
		return { label: "Unknown", onTestnet: true }
	}
}

/** Signs a transaction XDR with the currently selected wallet. */
export async function signWithWallet(xdr: string, address: string): Promise<string> {
	try {
		const result = (await getKit().signTransaction(xdr, {
			address,
			networkPassphrase: Networks.TESTNET,
		})) as unknown

		if (typeof result === "string") return result
		const signed = (result as { signedTxXdr?: unknown })?.signedTxXdr
		if (typeof signed === "string") return signed

		throw new AppError("unknown", "The wallet returned an unexpected signature result.")
	} catch (error) {
		throw toAppError(error, "Signing was not completed.")
	}
}
