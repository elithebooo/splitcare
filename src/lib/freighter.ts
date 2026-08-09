import {
	getAddress,
	getNetwork,
	isAllowed,
	isConnected,
	requestAccess,
	setAllowed,
	signTransaction,
} from "@stellar/freighter-api"

export type WalletErrorCode = "not-installed" | "rejected" | "wrong-network" | "unknown"

export class WalletError extends Error {
	code: WalletErrorCode

	constructor(code: WalletErrorCode, message: string) {
		super(message)
		this.name = "WalletError"
		this.code = code
	}
}

function unwrap<T>(result: T | { value: T; error?: unknown }): T {
	if (result && typeof result === "object" && "value" in (result as Record<string, unknown>)) {
		const typed = result as { value: T; error?: unknown }
		if (typed.error) throw toWalletError(typed.error)
		return typed.value
	}
	return result as T
}

function toWalletError(error: unknown): WalletError {
	const message =
		typeof error === "string" ? error : error instanceof Error ? error.message : String(error)

	if (/not installed|not found/i.test(message)) {
		return new WalletError(
			"not-installed",
			"Freighter was not detected. Install the extension and reload this page.",
		)
	}
	if (/declin|reject|denied|cancel/i.test(message)) {
		return new WalletError("rejected", "Wallet connection was cancelled in Freighter.")
	}

	return new WalletError("unknown", message || "Something went wrong talking to Freighter.")
}

export async function isFreighterInstalled(): Promise<boolean> {
	try {
		const result = await isConnected()
		return unwrap(result)
	} catch {
		return false
	}
}

export async function isAlreadyAuthorized(): Promise<boolean> {
	try {
		const result = await isAllowed()
		return unwrap(result)
	} catch {
		return false
	}
}

export interface NetworkInfo {
	label: string
	passphrase: string
	onTestnet: boolean
}

export async function readNetwork(): Promise<NetworkInfo> {
	const result = await getNetwork()
	const data = unwrap(result) as unknown as
		| { network: string; networkPassphrase: string }
		| string

	if (typeof data === "string") {
		return { label: data, passphrase: "", onTestnet: /testnet/i.test(data) }
	}

	return {
		label: data.network,
		passphrase: data.networkPassphrase,
		onTestnet: /testnet/i.test(data.network),
	}
}

async function readAddress(): Promise<string> {
	const result = await getAddress()
	const data = unwrap(result) as unknown as { address: string } | string
	return typeof data === "string" ? data : data.address
}

export async function connectWallet(): Promise<string> {
	const installed = await isFreighterInstalled()
	if (!installed) {
		throw new WalletError(
			"not-installed",
			"Freighter was not detected. Install the extension and reload this page.",
		)
	}

	try {
		const accessResult = await requestAccess()
		unwrap(accessResult)
		await setAllowed()
		return await readAddress()
	} catch (error) {
		if (error instanceof WalletError) throw error
		throw toWalletError(error)
	}
}

export async function restoreWallet(): Promise<string | null> {
	const installed = await isFreighterInstalled()
	if (!installed) return null

	const authorized = await isAlreadyAuthorized()
	if (!authorized) return null

	try {
		return await readAddress()
	} catch {
		return null
	}
}

export async function signWithFreighter(xdr: string, address: string): Promise<string> {
	try {
		const network = await readNetwork()
		const result = await signTransaction(xdr, {
			address,
			networkPassphrase: network.passphrase || undefined,
		})
		const data = unwrap(result) as unknown as { signedTxXdr: string } | string
		return typeof data === "string" ? data : data.signedTxXdr
	} catch (error) {
		if (error instanceof WalletError) throw error
		throw toWalletError(error)
	}
}
