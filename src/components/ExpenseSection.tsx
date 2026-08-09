import { useState } from "react"

import type { CustomExpenseDraft } from "../hooks/useCareSplit"
import { isAmountLike } from "../lib/money"
import type { CareExpense, ExpenseIconKey } from "../types"
import { EXPENSE_ICON_KEYS, ExpenseIcon, Plus, X } from "./Icons"

interface Props {
	expenses: CareExpense[]
	selectedExpenseId: string
	onSelect: (id: string) => void
	onAddCustom: (draft: CustomExpenseDraft) => void
	onRemove: (id: string) => void
	totalInput: string
	onTotalChange: (value: string) => void
	totalIsValid: boolean
}

const EMPTY_DRAFT: CustomExpenseDraft = {
	title: "",
	description: "",
	amount: "",
	icon: "heart",
}

export function ExpenseSection({
	expenses,
	selectedExpenseId,
	onSelect,
	onAddCustom,
	onRemove,
	totalInput,
	onTotalChange,
	totalIsValid,
}: Props) {
	const [adding, setAdding] = useState(false)
	const [draft, setDraft] = useState<CustomExpenseDraft>(EMPTY_DRAFT)

	function submitDraft() {
		if (!draft.title.trim() || !isAmountLike(draft.amount) || draft.amount === "") return
		onAddCustom(draft)
		setDraft(EMPTY_DRAFT)
		setAdding(false)
	}

	return (
		<section className="panel">
			<div className="panel__head">
				<div className="panel__headings">
					<span className="eyebrow">Step 01</span>
					<h2 className="panel__title">Pick the care expense</h2>
					<p className="panel__sub">Presets only prefill the amount. Nothing here is fixed.</p>
				</div>
			</div>

			<div className="panel__body">
				<div className="expense-grid">
					{expenses.map((expense) => {
						const active = expense.id === selectedExpenseId
						return (
							<button
								key={expense.id}
								type="button"
								className={`expense${active ? " expense--active" : ""}`}
								onClick={() => onSelect(expense.id)}
							>
								<span className="expense__icon">
									<ExpenseIcon name={expense.icon} size={18} />
								</span>
								<span className="expense__title">{expense.title}</span>
								<span className="expense__desc">{expense.description}</span>
								<span className="expense__amt num">{expense.suggestedAmount} XLM</span>
								{active ? (
									<span className="expense__check" aria-hidden="true" />
								) : null}
								{expense.isCustom ? (
									<span
										role="button"
										tabIndex={0}
										className="expense__remove"
										aria-label={`Remove ${expense.title}`}
										onClick={(event) => {
											event.stopPropagation()
											onRemove(expense.id)
										}}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.stopPropagation()
												onRemove(expense.id)
											}
										}}
									>
										<X size={11} />
									</span>
								) : null}
							</button>
						)
					})}

					<button
						type="button"
						className="expense expense--add"
						onClick={() => setAdding(true)}
					>
						<span className="expense__icon">
							<Plus size={18} />
						</span>
						<span className="expense__title">Add your own</span>
						<span className="expense__desc">Custom title, note, amount and icon</span>
					</button>
				</div>

				{adding ? (
					<div className="newexpense">
						<div className="newexpense__grid">
							<label className="field">
								<span className="field__label">Title</span>
								<input
									className="input"
									value={draft.title}
									onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
									placeholder="e.g. Physiotherapy session"
									maxLength={48}
								/>
							</label>
							<label className="field">
								<span className="field__label">Amount (XLM)</span>
								<input
									className="input input--mono"
									inputMode="decimal"
									value={draft.amount}
									onChange={(e) => {
										if (isAmountLike(e.target.value)) {
											setDraft((d) => ({ ...d, amount: e.target.value }))
										}
									}}
									placeholder="0.00"
								/>
							</label>
							<label className="field" style={{ gridColumn: "1 / -1" }}>
								<span className="field__label">Note (optional)</span>
								<input
									className="input"
									value={draft.description}
									onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
									placeholder="What is this for?"
									maxLength={64}
								/>
							</label>
						</div>

						<div className="newexpense__icons">
							{EXPENSE_ICON_KEYS.map((key: ExpenseIconKey) => (
								<button
									key={key}
									type="button"
									className={`icon-swatch${draft.icon === key ? " icon-swatch--active" : ""}`}
									onClick={() => setDraft((d) => ({ ...d, icon: key }))}
									aria-label={key}
								>
									<ExpenseIcon name={key} size={15} />
								</button>
							))}
						</div>

						<div className="newexpense__actions">
							<button
								type="button"
								className="btn btn--quiet btn--sm"
								onClick={() => {
									setAdding(false)
									setDraft(EMPTY_DRAFT)
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn--primary btn--sm"
								disabled={!draft.title.trim() || draft.amount === ""}
								onClick={submitDraft}
							>
								Add expense
							</button>
						</div>
					</div>
				) : null}

				<div className="total">
					<div className="total__meta">
						<span className="field__label">Total cost</span>
						<span className="total__hint">Edit freely. Presets are just a starting point</span>
					</div>
					<div className={`total__control${totalIsValid ? "" : " total__control--invalid"}`}>
						<input
							className="total__input"
							inputMode="decimal"
							value={totalInput}
							onChange={(e) => {
								if (isAmountLike(e.target.value)) onTotalChange(e.target.value)
							}}
							placeholder="0.00"
						/>
						<span className="total__unit">XLM</span>
					</div>
				</div>
			</div>
		</section>
	)
}
