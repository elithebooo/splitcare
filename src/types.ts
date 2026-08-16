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
}

export type WalletStatus =
	| "unknown"
	| "unavailable"
	| "disconnected"
	| "connecting"
	| "connected"

export interface WalletState {
	status: WalletStatus
	address: string | null
	networkLabel: string | null
	onTestnet: boolean
	balanceStroops: bigint | null
	accountFunded: boolean
	loadingBalance: boolean
	error: string | null
}

export type ThemePreference = "light" | "dark" | "system"
export type PrecisionPreference = "compact" | "full"

export interface SettingsState {
	theme: ThemePreference
	precision: PrecisionPreference
	notifications: boolean
}

export type PaymentPhase =
	| "idle"
	| "building"
	| "signing"
	| "submitting"
	| "anticipating"
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
	destination: string
	createdAt: string
}
