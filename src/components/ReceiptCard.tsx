import { useState } from "react"

import { shortenAddress } from "../lib/money"
import { explorerTxUrl } from "../lib/stellar"
import type { Receipt } from "../types"
import { Alert, ArrowUpRight, Check, CheckCircle, Copy } from "./Icons"

interface Props {
	receipt: Receipt
	onReset: () => void
}

function formatWhen(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	} catch {
		return iso
	}
}

export function ReceiptCard({ receipt, onReset }: Props) {
	const [copied, setCopied] = useState(false)
	const [shared, setShared] = useState(false)
	const success = receipt.outcome === "success"

	async function copyHash() {
		if (!receipt.hash) return
		try {
			await navigator.clipboard.writeText(receipt.hash)
			setCopied(true)
			window.setTimeout(() => setCopied(false), 1600)
		} catch {
			// Clipboard can be blocked; the hash stays selectable on screen.
		}
	}

	async function shareReceipt() {
		const text = `I just paid my share (${receipt.paidXlm} XLM) for ${receipt.expenseTitle} securely on the Stellar Testnet via SplitCare!`
		try {
			await navigator.clipboard.writeText(text)
			setShared(true)
			window.setTimeout(() => setShared(false), 2000)
		} catch {}
	}

	return (
		<div className={`card ${success ? "animate-ceremony" : ""}`}>
			<div className="card__head">
				<h3 className="card__title">{success ? "Your Contribution Confirmed 🎉" : "Receipt"}</h3>
				<button type="button" className="linkbtn" onClick={onReset}>
					New payment
				</button>
			</div>

			<div className={`banner ${success ? "banner--ok" : "banner--err"}`}>
				{success ? <CheckCircle size={15} /> : <Alert size={15} />}
				<span>
					<strong>{success ? "Payment confirmed on Testnet" : "Payment did not go through"}</strong>{" "}
					{success
						? `${receipt.paidXlm} XLM sent for ${receipt.expenseTitle}.`
						: (receipt.errorMessage ?? "The transaction was not submitted. Nothing was sent.")}
				</span>
			</div>

			<dl className="kv" style={{ marginTop: 14 }}>
				<div className="kv__row">
					<dt className="kv__k">Paid by</dt>
					<dd className="kv__v">
						{receipt.payerName} · {receipt.payerPercent}%
					</dd>
				</div>
				<div className="kv__row">
					<dt className="kv__k">Share</dt>
					<dd className="kv__v num">{receipt.paidXlm} XLM</dd>
				</div>
				<div className="kv__row">
					<dt className="kv__k">Total expense</dt>
					<dd className="kv__v num">
						{receipt.totalXlm} XLM · {receipt.memberCount} {receipt.memberCount === 1 ? "person" : "people"}
					</dd>
				</div>
				<div className="kv__row">
					<dt className="kv__k">Sent to</dt>
					<dd className="kv__v mono">{shortenAddress(receipt.destination, 6, 6)}</dd>
				</div>
				<div className="kv__row">
					<dt className="kv__k">When</dt>
					<dd className="kv__v">{formatWhen(receipt.createdAt)}</dd>
				</div>
			</dl>

			{success && receipt.hash ? (
				<>
					<div className="hashrow">
						<code className="mono">{receipt.hash}</code>
						<button
							type="button"
							className="iconbtn"
							onClick={() => void copyHash()}
							aria-label="Copy transaction hash"
							title="Copy transaction hash"
						>
							{copied ? <Check size={14} /> : <Copy size={14} />}
						</button>
					</div>
					<a className="explorer-link" href={explorerTxUrl(receipt.hash)} target="_blank" rel="noreferrer">
						View on Stellar Expert
						<ArrowUpRight size={13} />
					</a>
					
					<div style={{ marginTop: 12 }}>
						<button type="button" className="btn btn--secondary btn--block" onClick={() => void shareReceipt()}>
							{shared ? "Copied to clipboard!" : "Share your achievement"}
						</button>
					</div>
				</>
			) : null}
		</div>
	)
}
