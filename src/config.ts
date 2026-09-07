import contractIdFile from "../CONTRACT_ID.txt?raw"

const env = import.meta.env

/** Soroban RPC endpoint (public testnet RPC by default). */
export const SOROBAN_RPC_URL: string =
	(typeof env.VITE_SOROBAN_RPC_URL === "string" && env.VITE_SOROBAN_RPC_URL.trim()) ||
	"https://soroban-testnet.stellar.org"

/**
 * Deployed SplitCare contract id (Stellar Testnet).
 * Defaults to the deployment recorded in CONTRACT_ID.txt, which the deploy
 * workflow keeps up to date; set VITE_CONTRACT_ID to override.
 */
export const CONTRACT_ID: string =
	(typeof env.VITE_CONTRACT_ID === "string" && env.VITE_CONTRACT_ID.trim()) ||
	contractIdFile.trim()

/** True once a contract id is configured; gates all on-chain features. */
export const CONTRACT_ENABLED = CONTRACT_ID.length > 0

/** Display label for the configured Stellar network. */
export const STELLAR_NETWORK_LABEL: string =
	(typeof env.VITE_STELLAR_NETWORK === "string" && env.VITE_STELLAR_NETWORK.trim()) || "testnet"
