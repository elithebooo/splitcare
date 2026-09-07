/** Shared domain types for SplitCare. */

export type ExpenseIconKey =
	| "stethoscope"
	| "pill"
	| "home"
	| "car"
	| "calendar"
	| "lab"
	| "basket"
	| "heart"

export interface CareExpense {
	id: string
	title: string
	description: string
	/** Suggested amount in XLM. Used to prefill the total. */
	suggestedAmount: number
	icon: ExpenseIconKey
	isCustom?: boolean
}

export interface Member {
	id: string
	name: string
	/**
	 * Share stored in basis points of the total (10 000 bp = 100%).
	 * Integers keep the allocation exact and always summing to 100%.
	 */
	bp: number
	/** A pinned member keeps its share when other members are rebalanced. */
	locked: boolean
	/** Testnet wallet address this share is bound to when published on-chain. */
	address: string
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export type AppErrorCode =
	| "wallet-not-found"
	| "rejected"
	| "insufficient-balance"
	| "wrong-network"
	| "invalid-address"
	| "network"
	| "rpc"
	| "contract"
	| "unknown"

/* ------------------------------------------------------------------ */
/* Wallet (multi-wallet via StellarWalletsKit)                         */
/* ------------------------------------------------------------------ */

export type WalletStatus =
	| "unknown"
	| "unavailable"
	| "disconnected"
	| "connecting"
	| "connected"

export interface WalletProvider {
	id: string
	name: string
	icon: string
}

export interface WalletOption extends WalletProvider {
	url: string
	isAvailable: boolean
}

export interface WalletState {
	status: WalletStatus
	address: string | null
	provider: WalletProvider | null
	networkLabel: string | null
	onTestnet: boolean
	balanceStroops: bigint | null
	accountFunded: boolean
	loadingBalance: boolean
	error: string | null
	errorCode: AppErrorCode | null
}

export type ThemePreference = "light" | "dark" | "system"
export type PrecisionPreference = "compact" | "full"

export interface SettingsState {
	theme: ThemePreference
	precision: PrecisionPreference
	notifications: boolean
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export type PaymentPhase =
	| "idle"
	| "building"
	| "signing"
	| "submitting"
	| "anticipating"
	| "recording"
	| "done"

export interface Receipt {
	id: string
	outcome: "success" | "failure"
	hash?: string
	errorMessage?: string
	expenseTitle: string
	totalXlm: string
	memberCount: number
	payerName: string
	payerPercent: string
	paidXlm: string
	source: string
	destination: string
	memo?: string
	createdAt: string
	/** Hash of the Soroban contract call that recorded this payment. */
	contractTxHash?: string
	/** On-chain expense id this payment was recorded against. */
	expenseOnchainId?: string
}

/** A payment that succeeded on Stellar but still needs its contract record. */
export interface PendingContractRecord {
	expenseId: string
	memberIndex: number
	paymentTxHash: string
	destination: string
	/** Stored as a decimal string because JSON cannot hold bigint. */
	amountStroops: string
}

/* ------------------------------------------------------------------ */
/* Contract transaction status (Soroban)                               */
/* ------------------------------------------------------------------ */

export type TxStage =
	| "idle"
	| "preparing"
	| "awaiting-signature"
	| "submitting"
	| "pending"
	| "success"
	| "failed"
	| "rejected"

export interface TxStatus {
	stage: TxStage
	hash: string | null
	error: string | null
}

/* ------------------------------------------------------------------ */
/* Contract data + events                                              */
/* ------------------------------------------------------------------ */

export interface FeedMember {
	name: string
	/** Wallet address this share is bound to on-chain. */
	address: string | null
	amountStroops: bigint
	paid: boolean
	paidBy: string | null
	txHash: string | null
}

export interface FeedExpense {
	id: string
	title: string
	creator: string
	totalStroops: bigint
	members: FeedMember[]
	createdLedger: number
	createdTxHash: string | null
}

export type ContractEventKind = "created" | "paid"

export interface ContractEventInfo {
	/** Unique event id (also used as the RPC paging cursor). */
	id: string
	kind: ContractEventKind
	expenseId: string
	ledger: number
	closedAt: string
	/** Hash of the contract invocation that emitted this event. */
	txHash: string | null
	/** Short human readable summary for activity feeds. */
	summary: string
	/** Present on "created" events: the full expense payload. */
	created?: Omit<FeedExpense, "createdTxHash">
	/** Present on "paid" events. */
	memberIndex?: number
	payer?: string
	amountStroops?: bigint
	/** Present on "paid" events: hash of the underlying XLM payment. */
	paymentTxHash?: string
}
