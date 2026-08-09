export const STROOPS_PER_XLM = 10_000_000n
export const XLM_DECIMALS = 7

const AMOUNT_PATTERN = /^\d{1,15}(\.\d{0,7})?$/

export function isAmountLike(input: string): boolean {
	if (input === "") return true
	return AMOUNT_PATTERN.test(input)
}

export function parseXlm(input: string): bigint | null {
	const trimmed = input.trim()
	if (trimmed === "" || !AMOUNT_PATTERN.test(trimmed)) return null

	const [wholePart, fractionPart = ""] = trimmed.split(".")
	const paddedFraction = (fractionPart + "0".repeat(XLM_DECIMALS)).slice(0, XLM_DECIMALS)

	try {
		const whole = BigInt(wholePart === "" ? "0" : wholePart)
		const fraction = BigInt(paddedFraction === "" ? "0" : paddedFraction)
		return whole * STROOPS_PER_XLM + fraction
	} catch {
		return null
	}
}

export function stroopsToStellarAmount(stroops: bigint): string {
	if (stroops < 0n) throw new Error("Amount cannot be negative")

	const whole = stroops / STROOPS_PER_XLM
	const fraction = stroops % STROOPS_PER_XLM
	const fractionStr = fraction.toString().padStart(XLM_DECIMALS, "0").replace(/0+$/, "")

	return fractionStr === "" ? whole.toString() : `${whole}.${fractionStr}`
}

export function formatXlm(
	stroops: bigint,
	{ minDecimals = 2, maxDecimals = 7 }: { minDecimals?: number; maxDecimals?: number } = {},
): string {
	const negative = stroops < 0n
	const abs = negative ? -stroops : stroops

	const whole = abs / STROOPS_PER_XLM
	const fraction = abs % STROOPS_PER_XLM
	let fractionStr = fraction.toString().padStart(XLM_DECIMALS, "0").slice(0, maxDecimals)

	while (fractionStr.length > minDecimals && fractionStr.endsWith("0")) {
		fractionStr = fractionStr.slice(0, -1)
	}

	const wholeStr = whole.toLocaleString("en-US")
	const amount = fractionStr.length > 0 ? `${wholeStr}.${fractionStr}` : wholeStr

	return negative ? `-${amount}` : amount
}

export function shortenAddress(address: string, lead = 4, tail = 4): string {
	if (address.length <= lead + tail + 1) return address
	return `${address.slice(0, lead)}…${address.slice(-tail)}`
}

export function addressColors(address: string): { a: string; b: string } {
	let hash = 0
	for (let i = 0; i < address.length; i++) {
		hash = (hash * 31 + address.charCodeAt(i)) >>> 0
	}
	const hue = hash % 360
	const hueB = (hue + 58) % 360
	return {
		a: `hsl(${hue} 70% 52%)`,
		b: `hsl(${hueB} 70% 46%)`,
	}
}
