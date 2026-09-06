import type { AppErrorCode } from "../types"

/** Application error with a stable, user-presentable code. */
export class AppError extends Error {
	readonly code: AppErrorCode

	constructor(code: AppErrorCode, message: string) {
		super(message)
		this.name = "AppError"
		this.code = code
	}
}

const REJECTED_PATTERN = /declin|reject|denied|cancel|closed by user|user closed/i
const NOT_INSTALLED_PATTERN = /not installed|not detected|isn't installed|no wallet|extension.*(missing|not)/i
const INSUFFICIENT_PATTERN = /insufficient|underfunded|not enough/i
const NETWORK_PATTERN = /failed to fetch|networkerror|network error|timeout|timed out|econn|unavailable|502|503/i

/**
 * Converts any thrown value into an AppError with a best-guess code.
 * Wallet libraries throw plain objects/strings, so we normalize by message.
 */
export function toAppError(error: unknown, fallback: string): AppError {
	if (error instanceof AppError) return error

	const message =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: fallback

	if (REJECTED_PATTERN.test(message)) {
		return new AppError("rejected", "The request was rejected in your wallet. Nothing was signed or sent.")
	}
	if (NOT_INSTALLED_PATTERN.test(message)) {
		return new AppError(
			"wallet-not-found",
			"That wallet was not detected in this browser. Install it, then reload and try again.",
		)
	}
	if (INSUFFICIENT_PATTERN.test(message)) {
		return new AppError(
			"insufficient-balance",
			"The account does not have enough XLM to cover this transaction and the network fee.",
		)
	}
	if (NETWORK_PATTERN.test(message)) {
		return new AppError(
			"network",
			"Could not reach the Stellar network. Check your connection and try again.",
		)
	}

	return new AppError("unknown", message || fallback)
}

export function errorMessage(error: unknown, fallback: string): string {
	return toAppError(error, fallback).message
}
