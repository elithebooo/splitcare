import { formatXlm } from "../lib/money"
import { bpToPercentString, percentStringToBp, TOTAL_BP } from "../lib/split"
import type { Member } from "../types"
import { Lock, Minus, Plus, Refresh, Unlock, X } from "./Icons"

interface Props {
	members: Member[]
	amounts: bigint[]
	allocatedBp: number
	payerId: string
	onSetPayer: (id: string) => void
	onRename: (id: string, name: string) => void
	onShareChange: (id: string, bp: number) => void
	onToggleLock: (id: string) => void
	onAddMember: () => void
	onRemoveMember: (id: string) => void
	onCountChange: (count: number) => void
	onResetEqual: () => void
}

export function segmentColor(index: number): string {
	return `var(--seg-${(index % 8) + 1})`
}

export function SplitSection({
	members,
	amounts,
	allocatedBp,
	payerId,
	onSetPayer,
	onRename,
	onShareChange,
	onToggleLock,
	onAddMember,
	onRemoveMember,
	onCountChange,
	onResetEqual,
}: Props) {
	const balanced = allocatedBp === TOTAL_BP

	return (
		<section className="panel">
			<div className="panel__head">
				<div className="panel__headings">
					<span className="eyebrow">Step 02</span>
					<h2 className="panel__title">Split it between people</h2>
					<p className="panel__sub">
						Shares start equal. Change one and the rest rebalance so the total stays at exactly
						100%.
					</p>
				</div>
				<div className="split-controls">
					<div className="people">
						<span className="people__label">People</span>
						<div className="stepper">
							<button
								type="button"
								className="iconbtn"
								onClick={() => onCountChange(members.length - 1)}
								disabled={members.length <= 1}
								aria-label="Fewer people"
							>
								<Minus size={13} />
							</button>
							<input
								className="stepper__value"
								inputMode="numeric"
								value={members.length}
								onChange={(e) => {
									const n = Number.parseInt(e.target.value, 10)
									if (Number.isFinite(n)) onCountChange(n)
								}}
							/>
							<button
								type="button"
								className="iconbtn"
								onClick={onAddMember}
								disabled={members.length >= 12}
								aria-label="More people"
							>
								<Plus size={13} />
							</button>
						</div>
					</div>
					<button type="button" className="linkbtn split-actions" onClick={onResetEqual}>
						<Refresh size={13} />
						Reset to equal shares
					</button>
				</div>
			</div>

			<div className="panel__body">
				<div className="alloc">
					<div className="alloc__track">
						{members.map((member, index) => (
							<span
								key={member.id}
								className="alloc__seg"
								style={{ width: `${member.bp / 100}%`, background: segmentColor(index) }}
								title={`${member.name || "Member"} · ${bpToPercentString(member.bp)}%`}
							/>
						))}
					</div>
					<div className="alloc__legend">
						<span>Allocated</span>
						<span className={`alloc__total num${balanced ? "" : " alloc__total--off"}`}>
							{bpToPercentString(allocatedBp)}%
						</span>
					</div>
				</div>

				<div className="members">
					<div className="members__head">
						<span />
						<span>Name</span>
						<span>Share</span>
						<span>Payer</span>
						<span />
						<span>Amount</span>
					</div>

					{members.map((member, index) => {
						const isPayer = member.id === payerId
						return (
							<div key={member.id} className={`member${isPayer ? " member--payer" : ""}`}>
								<span className="member__swatch" style={{ background: segmentColor(index) }} />
								<input
									className="ghost-input member__name"
									value={member.name}
									onChange={(e) => onRename(member.id, e.target.value)}
									maxLength={24}
									aria-label="Name"
								/>
								<span className={`pct member__pct${member.locked ? " pct--locked" : ""}`}>
									<input
										className="ghost-input"
										inputMode="decimal"
										value={bpToPercentString(member.bp)}
										disabled={member.locked}
										onChange={(e) => {
											const bp = percentStringToBp(e.target.value)
											if (bp !== null) onShareChange(member.id, bp)
										}}
										aria-label="Share percent"
									/>
									%
								</span>
								<button
									type="button"
									className="payer-toggle member__payer"
									onClick={() => onSetPayer(member.id)}
									aria-pressed={isPayer}
								>
									<span className="payer-toggle__dot" />
									{isPayer ? "You pay" : "Set as payer"}
								</button>
								<button
									type="button"
									className="iconbtn member__lock"
									onClick={() => onToggleLock(member.id)}
									aria-label={member.locked ? "Unlock share" : "Lock share"}
									title={member.locked ? "Unlock share" : "Lock share"}
								>
									{member.locked ? <Lock size={13} /> : <Unlock size={13} />}
								</button>
								<span className="member__amt num">{formatXlm(amounts[index] ?? 0n)} XLM</span>
								{members.length > 1 ? (
									<button
										type="button"
										className="iconbtn member__remove"
										onClick={() => onRemoveMember(member.id)}
										aria-label={`Remove ${member.name || "member"}`}
									>
										<X size={12} />
									</button>
								) : null}
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
