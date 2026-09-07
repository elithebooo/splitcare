# SplitCare — Level 2 Submission Evidence

## Demo

- Live app: https://splitcare-hvgs.vercel.app
- Repository: https://github.com/elithebooo/splitcare
- Level 2 implementation PR: https://github.com/elithebooo/splitcare/pull/1

## Multi-wallet evidence

![SplitCare StellarWalletsKit multi-wallet picker](./screenshots/level2-wallet-options.svg)

The wallet picker displays multiple StellarWalletsKit providers and their browser availability. The captured state shows Albedo, Freighter, xBull, and HOT Wallet detected, while Rabet, LOBSTR, Hana Wallet, and Klever Wallet are listed as not installed.

## Deployed Soroban contract

- Network: Stellar Testnet
- Contract ID: `CC7IQCOJVGJ6WEE2BILWVINQX2NEZRV7YNIGS4MLH2MGCX4R7CST7AMY`
- Contract explorer: https://stellar.expert/explorer/testnet/contract/CC7IQCOJVGJ6WEE2BILWVINQX2NEZRV7YNIGS4MLH2MGCX4R7CST7AMY

## Verifiable transactions

### Contract invocation

A successful `create_expense` invocation against the deployed contract:

- Hash: `70c9b511c648cf6cd8ecf1c76a687fb92f16182b47797d9ba72356cc2e7b8859`
- Explorer: https://stellar.expert/explorer/testnet/tx/70c9b511c648cf6cd8ecf1c76a687fb92f16182b47797d9ba72356cc2e7b8859

### Native XLM payment from the app

- Amount: 15 XLM
- Expense: Doctor visit
- Split: 50% of 30 XLM between two people
- Hash: `a3b0dfc9f718c6a86ffba211fe85fd9c9068774ecc3711480f2591eb25ee7713`
- Explorer: https://stellar.expert/explorer/testnet/tx/a3b0dfc9f718c6a86ffba211fe85fd9c9068774ecc3711480f2591eb25ee7713

The receipt also shows a separate contract-record transaction (`dd7fc9…319174`). This is expected: the app first transfers native XLM and then invokes `record_payment` to mark the share paid and associate the payment hash with the on-chain expense.

## Payment and contract screenshots

The final Level 2 screenshots show:

1. **Published expense and enabled payment:** the contract transaction card is `SUCCESS`, every lifecycle step is green, the expense is marked “Published on the SplitCare contract,” and the 15 XLM `Pay my share` action is enabled.
2. **Confirmed payment receipt:** 15 XLM is confirmed on Stellar Testnet for “Doctor visit”; the receipt shows payer/share/total, source and destination, the payment hash, the separate contract-record hash, timestamp, and Stellar Expert links.

Together the evidence demonstrates the complete Level 2 path:

`wallet picker` → `create_expense` → wallet signature → Soroban confirmation → native XLM payment → `record_payment` → confirmed receipt.

## Requirement mapping

- Multi-wallet connection: StellarWalletsKit wallet picker with detected/not-installed states
- Error handling: wallet not found, user rejection, insufficient balance, wrong network, invalid address, RPC/contract errors
- Smart contract writes: `create_expense`, `record_payment`
- Smart contract reads: `get_expense`, `recent_ids`
- Live synchronization: polling Soroban contract events with cursor handling
- Visible transaction state: preparing, awaiting signature, submitting, pending, success/failed/rejected
- Testnet proof: deployed contract, successful contract invocation, successful 15 XLM payment, and contract payment record
