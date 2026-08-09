export const TOTAL_BP = 10_000

export interface Allocation {
	bp: number
	locked: boolean
}

function distribute(total: number, weights: number[]): number[] {
	const weightSum = weights.reduce((sum, w) => sum + w, 0)
	if (weightSum <= 0 || weights.length === 0) {
		return equalBps(weights.length).map((bp) => Math.round((bp / TOTAL_BP) * total))
	}

	const raw = weights.map((w) => (w / weightSum) * total)
	const floored = raw.map(Math.floor)
	let remainder = total - floored.reduce((sum, v) => sum + v, 0)

	const order = raw
		.map((value, index) => ({ index, frac: value - Math.floor(value) }))
		.sort((a, b) => b.frac - a.frac)

	const result = [...floored]
	for (let i = 0; i < order.length && remainder > 0; i++) {
		result[order[i].index] += 1
		remainder -= 1
	}

	return result
}

/** Even split in basis points; any remainder goes to the LAST members. */
export function equalBps(count: number): number[] {
	if (count <= 0) return []
	const base = Math.floor(TOTAL_BP / count)
	const remainder = TOTAL_BP - base * count
	return Array.from({ length: count }, (_, index) =>
		index >= count - remainder ? base + 1 : base,
	)
}

export function sumBps(values: number[]): number {
	return values.reduce((sum, v) => sum + v, 0)
}

export function normalizeBps(entries: Allocation[]): number[] {
	const total = sumBps(entries.map((e) => e.bp))
	if (total === TOTAL_BP || entries.length === 0) return entries.map((e) => e.bp)

	const lockedTotal = sumBps(entries.filter((e) => e.locked).map((e) => e.bp))
	const freeIndexes = entries
		.map((entry, index) => ({ entry, index }))
		.filter(({ entry }) => !entry.locked)

	const freeTotalTarget = Math.max(0, TOTAL_BP - lockedTotal)
	if (freeIndexes.length === 0) return entries.map((e) => e.bp)

	const freeWeights = freeIndexes.map(({ entry }) => Math.max(entry.bp, 1))
	const distributed = distribute(freeTotalTarget, freeWeights)

	const result = entries.map((e) => e.bp)
	freeIndexes.forEach(({ index }, i) => {
		result[index] = distributed[i]
	})

	return result
}

/** Change one member's share and rebalance the unlocked remainder so the total stays exactly 100%. */
export function rebalanceBps(
	entries: Allocation[],
	changedIndex: number,
	requestedBp: number,
): number[] {
	const clamped = Math.max(0, Math.min(TOTAL_BP, Math.round(requestedBp)))

	const lockedTotal = sumBps(
		entries.filter((e, i) => e.locked && i !== changedIndex).map((e) => e.bp),
	)
	const maxAllowed = Math.max(0, TOTAL_BP - lockedTotal)
	const changedBp = Math.min(clamped, maxAllowed)

	const others = entries
		.map((entry, index) => ({ entry, index }))
		.filter(({ index, entry }) => index !== changedIndex && !entry.locked)

	const remaining = Math.max(0, TOTAL_BP - lockedTotal - changedBp)
	const weights = others.map(({ entry }) => Math.max(entry.bp, 1))
	const distributed = distribute(remaining, weights)

	const result = entries.map((e) => e.bp)
	result[changedIndex] = changedBp
	others.forEach(({ index }, i) => {
		result[index] = distributed[i]
	})

	return result
}

/** Splits a stroop amount by basis points using the largest-remainder method so the sum is exact. */
export function splitStroops(totalStroops: bigint, bps: number[]): bigint[] {
	if (bps.length === 0) return []

	const raw = bps.map((bp) => (totalStroops * BigInt(bp)) / BigInt(TOTAL_BP))
	const allocated = raw.reduce((sum, v) => sum + v, 0n)
	let remainder = totalStroops - allocated

	const order = bps
		.map((bp, index) => ({ bp, index }))
		.sort((a, b) => b.bp - a.bp)

	const result = [...raw]
	let i = 0
	while (remainder > 0n && order.length > 0) {
		result[order[i % order.length].index] += 1n
		remainder -= 1n
		i += 1
	}

	return result
}

export function bpToPercentString(bp: number, decimals = 2): string {
	return (bp / 100).toFixed(decimals)
}

const PERCENT_PATTERN = /^\d{0,3}(\.\d{0,2})?$/

export function percentStringToBp(value: string): number | null {
	if (!PERCENT_PATTERN.test(value)) return null
	if (value === "" || value === ".") return 0
	const num = Number.parseFloat(value)
	if (Number.isNaN(num)) return null
	return Math.round(num * 100)
}
