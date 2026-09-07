# SplitCare

SplitCare is a Stellar Testnet app for splitting a care-related expense between
people. **Level 2** turns it into a multi-wallet payment tracker backed by a
Soroban smart contract with real-time event sync.

The app does the following:

- connects **any Stellar wallet** supported by StellarWalletsKit (Freighter, xBull, Albedo, Rabet, Lobstr, Hana, …)
- reads the connected wallet address and checks the Testnet network
- reads the wallet's native XLM balance from Horizon
- lets the user split a total amount between people
- **publishes the expense on a Soroban contract** (`create_expense`)
- builds and sends the selected share as a native XLM payment
- **records the payment on the contract** (`record_payment`)
- **streams contract events** (`splitcare/created`, `splitcare/paid`) and rebuilds expense state live — no manual refresh
- shows the full transaction lifecycle: preparing → signing → pending → success / failed / rejected
- shows payment and contract transaction hashes with Stellar Expert links

## Live Demo

https://splitcare-hvgs.vercel.app

## Demo Recording

![SplitCare demo recording](./screenshots/splitcare-demo.gif)

## Level 2 checklist

| Requirement | Where |
| --- | --- |
| StellarWalletsKit implementation | `src/lib/walletKit.ts` + wallet picker in `src/components/WalletOptions.tsx` |
| Error: wallet not found | `connectWallet()` throws `wallet-not-found`; picker lists unavailable wallets as "Not installed" |
| Error: rejected by user | `toAppError()` maps rejections to `rejected`; shown in wallet card, pay card and tx status |
| Error: insufficient balance | Preflight blocker in `PaymentsPage.tsx` + Horizon error mapping in `src/lib/stellar.ts` |
| Contract deployed on Testnet | `contracts/splitcare` — see [Contract deployment](#contract-deployment) |
| Contract called from frontend | `src/lib/contract.ts` + `src/hooks/useContract.ts` |
| Read + write contract data | writes: `create_expense` / `record_payment`; reads: `get_expense` / `recent_ids` |
| Event listening + state sync | `src/hooks/useContractEvents.ts` polls `getEvents`; feed rebuilt in `buildFeed()` |
| Transaction status visible | `src/components/TxStatusCard.tsx` (preparing → awaiting-signature → submitting → pending → success / failed / rejected) |
| 10+ meaningful commits | see the `level-2-soroban` branch history |

## Contract deployment

The contract lives in `contracts/splitcare` (Rust + soroban-sdk 22).

- **Deployed contract address:** `CC7IQCOJVGJ6WEE2BILWVINQX2NEZRV7YNIGS4MLH2MGCX4R7CST7AMY`
- **Contract call transaction hash:** `TODO: publish an expense from the app and paste the hash here`
  (verifiable on `https://stellar.expert/explorer/testnet/tx/<hash>`)

Deploy with either option:

```bash
# option 1: local script (creates and funds a throwaway testnet deployer)
./scripts/deploy-contract.sh
```

```text
# option 2: GitHub → Actions → "Deploy SplitCare contract (Testnet)" → Run workflow
# the contract id is reported in the run summary; no secrets needed
```

Then set the id for the frontend:

```bash
echo "VITE_CONTRACT_ID=<contract id>" >> .env
# and add VITE_CONTRACT_ID in your Vercel project environment
```

## Screenshots for submission

- `screenshots/level2-wallet-options.png` — wallet picker listing multiple wallets (add after running the app)
- `screenshots/level2-tx-status.png` — contract transaction status card
- existing flow screenshots from Level 1 remain valid

## Main Flow

1. Open the app and pick a wallet from the StellarWalletsKit picker.
2. Use a wallet on Stellar Testnet; fund it with Friendbot if needed.
3. Choose or create an expense and set the split.
4. Publish the expense on-chain (contract write #1).
5. Enter a funded Testnet destination and pay your share (XLM payment).
6. The payment is recorded on the contract (contract write #2).
7. The Activity page updates live from contract events.

## Testnet Notes

- The app uses Stellar Testnet only; the payment asset is native XLM.
- Expense titles and member names published on-chain are public testnet data — use demo names.
- The destination account must exist on Testnet before receiving a payment.
- The contract only records payments; the actual XLM moves in a normal payment transaction.
- Contract events are read from Soroban RPC (`getEvents`), which keeps a limited event history on testnet.

## Tech Stack

- React + Vite + TypeScript
- `@creit.tech/stellar-wallets-kit` (multi-wallet, npm v1 line)
- `@stellar/stellar-sdk` (Horizon + Soroban RPC)
- Soroban contract in Rust (`contracts/splitcare`)
- CSS: tokens, base, app styles, level2 additions

## Project Structure

```text
contracts/
└─ splitcare/          Soroban contract (lib.rs, tests, Cargo.toml)
scripts/
└─ deploy-contract.sh  Local testnet deploy helper
.github/workflows/
└─ deploy-contract.yml Manual GitHub Action that deploys to testnet
src/
├─ components/         UI cards, wallet picker, tx status, live feed
├─ data/               Default expense presets
├─ hooks/              Wallet (kit), split, settings, contract, events
├─ lib/
│  ├─ walletKit.ts     StellarWalletsKit connect/sign/network
│  ├─ contract.ts      Soroban client: invoke, read, events, feed
│  ├─ errors.ts        Typed app errors (wallet-not-found, rejected, …)
│  ├─ stellar.ts       Horizon payments, Friendbot, explorer links
│  ├─ money.ts         XLM/stroop parsing and formatting
│  └─ split.ts         Exact percentage and stroop splitting
├─ pages/              Landing, account, payments, activity, settings
└─ styles/             tokens, base, app, level2
```

## Local Setup

```bash
git clone https://github.com/elithebooo/splitcare.git
cd splitcare
npm install        # regenerates package-lock.json with the new wallet-kit dependency
cp .env.example .env  # set VITE_CONTRACT_ID after deploying
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build and Test

```bash
npm run typecheck
npm run build
npm run contract:test     # cargo test for the Soroban contract
npm run contract:build    # builds the contract wasm
```

## Current Limitations

- Testnet-only; receipts are kept in the current browser session.
- On-chain expenses are public and kept in contract storage with a TTL (~30 days).
- The live feed covers the recent ledger window exposed by the RPC event history.
- The contract records payments but does not custody or move funds.
