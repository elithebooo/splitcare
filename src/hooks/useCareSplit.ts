import { useCallback, useMemo, useState } from "react"

import { DEFAULT_EXPENSES, defaultMemberName } from "../data/defaultExpenses"
import { createId } from "../lib/id"
import { parseXlm } from "../lib/money"
import { equalBps, rebalanceBps, splitStroops, sumBps } from "../lib/split"
import type { CareExpense, ExpenseIconKey, Member } from "../types"

export const MIN_MEMBERS = 1
export const MAX_MEMBERS = 12

export interface CustomExpenseDraft {
	title: string
	description: string
	amount: string
	icon: ExpenseIconKey
}

function createMembers(count: number): Member[] {
	const bps = equalBps(count)
	return Array.from({ length: count }, (_, index) => ({
		id: createId("member"),
		name: defaultMemberName(index),
		bp: bps[index],
		locked: false,
	}))
}

export function useCareSplit() {
	const [expenses, setExpenses] = useState<CareExpense[]>(DEFAULT_EXPENSES)
	const [selectedExpenseId, setSelectedExpenseId] = useState<string>("doctor-visit")
	const [totalInput, setTotalInput] = useState<string>("30")
	const [recipient, setRecipient] = useState<string>("")
	const [members, setMembers] = useState<Member[]>(() => createMembers(2))
	const [payerId, setPayerId] = useState<string>(() => members[0]?.id ?? "")

	const selectedExpense = useMemo(
		() => expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
		[expenses, selectedExpenseId],
	)

	const totalStroops = useMemo(() => parseXlm(totalInput), [totalInput])

	const selectExpense = useCallback(
		(id: string) => {
			const expense = expenses.find((item) => item.id === id)
			setSelectedExpenseId(id)
			if (expense) setTotalInput(String(expense.suggestedAmount))
		},
		[expenses],
	)

	const addCustomExpense = useCallback((draft: CustomExpenseDraft) => {
		const id = createId("expense")
		const amount = Number.parseFloat(draft.amount)

		setExpenses((current) => [
			...current,
			{
				id,
				title: draft.title.trim() || "Custom expense",
				description: draft.description.trim(),
				suggestedAmount: Number.isFinite(amount) ? amount : 0,
				icon: draft.icon,
				isCustom: true,
			},
		])
		setSelectedExpenseId(id)
		setTotalInput(Number.isFinite(amount) ? draft.amount : "")
	}, [])

	const removeExpense = useCallback(
		(id: string) => {
			setExpenses((current) => current.filter((expense) => expense.id !== id))
			if (selectedExpenseId === id) {
				setSelectedExpenseId(DEFAULT_EXPENSES[0]?.id ?? "")
			}
		},
		[selectedExpenseId],
	)

	const allocatedBp = useMemo(() => sumBps(members.map((m) => m.bp)), [members])

	const amounts = useMemo(() => {
		if (totalStroops === null) return members.map(() => 0n)
		return splitStroops(
			totalStroops,
			members.map((m) => m.bp),
		)
	}, [members, totalStroops])

	const addMember = useCallback(() => {
		setMembers((current) => {
			if (current.length >= MAX_MEMBERS) return current
			const nextCount = current.length + 1
			const bps = equalBps(nextCount)
			const unlocked = current.map((member, index) => ({
				...member,
				bp: member.locked ? member.bp : bps[index],
			}))
			return [
				...unlocked,
				{
					id: createId("member"),
					name: defaultMemberName(current.length),
					bp: bps[nextCount - 1],
					locked: false,
				},
			]
		})
	}, [])

	const removeMember = useCallback((id: string) => {
		setMembers((current) => {
			if (current.length <= MIN_MEMBERS) return current
			const filtered = current.filter((member) => member.id !== id)
			const bps = equalBps(filtered.length)
			return filtered.map((member, index) => ({
				...member,
				bp: member.locked ? member.bp : bps[index],
			}))
		})
		setPayerId((current) => (current === id ? "" : current))
	}, [])

	const setMemberCount = useCallback((count: number) => {
		const clamped = Math.max(MIN_MEMBERS, Math.min(MAX_MEMBERS, count))
		setMembers((current) => {
			if (clamped === current.length) return current
			if (clamped > current.length) {
				const additions = Array.from({ length: clamped - current.length }, (_, i) => ({
					id: createId("member"),
					name: defaultMemberName(current.length + i),
					bp: 0,
					locked: false,
				}))
				const next = [...current, ...additions]
				const bps = equalBps(next.length)
				return next.map((member, index) => ({ ...member, bp: bps[index], locked: false }))
			}

			const next = current.slice(0, clamped)
			const bps = equalBps(next.length)
			return next.map((member, index) => ({ ...member, bp: bps[index], locked: false }))
		})
	}, [])

	const renameMember = useCallback((id: string, name: string) => {
		setMembers((current) =>
			current.map((member) => (member.id === id ? { ...member, name } : member)),
		)
	}, [])

	const setMemberShare = useCallback((id: string, percentBp: number) => {
		setMembers((current) => {
			const index = current.findIndex((member) => member.id === id)
			if (index === -1) return current
			const next = rebalanceBps(
				current.map((m) => ({ bp: m.bp, locked: m.locked })),
				index,
				percentBp,
			)
			return current.map((member, i) => ({ ...member, bp: next[i] }))
		})
	}, [])

	const toggleLock = useCallback((id: string) => {
		setMembers((current) =>
			current.map((member) => (member.id === id ? { ...member, locked: !member.locked } : member)),
		)
	}, [])

	const resetToEqual = useCallback(() => {
		setMembers((current) => {
			const bps = equalBps(current.length)
			return current.map((member, index) => ({ ...member, bp: bps[index], locked: false }))
		})
	}, [])

	const payerIndex = useMemo(
		() => members.findIndex((member) => member.id === payerId),
		[members, payerId],
	)

	const payer = payerIndex >= 0 ? members[payerIndex] : null
	const payerAmountStroops = payerIndex >= 0 ? (amounts[payerIndex] ?? 0n) : 0n

	const setPayer = useCallback((id: string) => {
		setPayerId(id)
	}, [])

	return {
		expenses,
		selectedExpense,
		selectedExpenseId,
		selectExpense,
		addCustomExpense,
		removeExpense,
		totalInput,
		setTotalInput,
		totalStroops,
		recipient,
		setRecipient,
		members,
		amounts,
		allocatedBp,
		addMember,
		removeMember,
		setMemberCount,
		renameMember,
		setMemberShare,
		toggleLock,
		resetToEqual,
		payer,
		payerId,
		payerIndex,
		payerAmountStroops,
		setPayer,
	}
}

export type CareSplit = ReturnType<typeof useCareSplit>
