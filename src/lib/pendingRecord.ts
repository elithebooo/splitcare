import type { PendingContractRecord } from "../types"

const STORAGE_KEY = "splitcare:pending-contract-record"

/**
 * Persists a payment that succeeded on Stellar but still needs its contract
 * record, so a failed post-payment call can be retried even after a reload.
 */
export function loadPendingRecord(): PendingContractRecord | null {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as PendingContractRecord
		if (typeof parsed?.expenseId !== "string" || typeof parsed?.paymentTxHash !== "string") {
			return null
		}
		return parsed
	} catch {
		return null
	}
}

export function savePendingRecord(record: PendingContractRecord): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
	} catch {
		// storage may be unavailable; the retry banner just won't persist
	}
}

export function clearPendingRecord(): void {
	try {
		window.localStorage.removeItem(STORAGE_KEY)
	} catch {
		// ignore
	}
}
