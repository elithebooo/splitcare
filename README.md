# SplitCare — Stellar White Belt Level 1 Submission

SplitCare is a Stellar Testnet dApp built for the **Rise In Stellar Journey to Mastery — White Belt / Level 1** challenge.

The White Belt goal is to demonstrate the core Stellar wallet flow: connect a wallet, read balances, build and sign a transaction, submit it on-chain, and show a verifiable transaction hash. SplitCare wraps that flow in a small product use case: splitting a care-related expense and paying only the selected share in testnet XLM.

## Live Demo

The project is deployed on Vercel. Add the final Vercel URL in the Rise In submission form and, if desired, paste it here before the final GitHub submission screenshot pass.

## White Belt Requirements Checklist

| Requirement | Status | Where it is implemented |
| --- | --- | --- |
| Connect a Stellar wallet | ✅ | Freighter connect flow in `src/lib/freighter.ts` and wallet UI |
| Read the connected public key | ✅ | `requestAccess()` / `getAddress()` in `src/lib/freighter.ts` |
| Enforce Stellar Testnet | ✅ | Network check in `useWallet.ts` and payment blockers |
| Fetch and display XLM balance | ✅ | `loadNativeBalance()` in `src/lib/stellar.ts`, `WalletCard.tsx`, and Account balance checker |
| Help fund a Testnet account | ✅ | Friendbot helper in `src/lib/stellar.ts` |
| Build a payment transaction | ✅ | `buildPaymentXdr()` in `src/lib/stellar.ts` |
| Sign with Freighter | ✅ | `signWithFreighter()` in `src/lib/freighter.ts` |
| Submit transaction to Stellar | ✅ | `submitSignedXdr()` via Horizon Testnet |
| Show transaction hash | ✅ | `ReceiptCard.tsx` |
| Link to a block explorer | ✅ | Stellar Expert transaction and account links |

## What the App Does

- Connects to the Freighter browser wallet.
- Checks that the wallet is on Stellar Testnet.
- Loads and displays the wallet's native XLM balance.
- Checks the balance of any Stellar Testnet public key from the Account page.
- Lets the user select or create a care-related expense.
- Splits the total by equal shares or custom percentages.
- Builds a Stellar Testnet XLM payment for the selected payer's share.
- Opens Freighter for transaction signing.
- Submits the signed transaction to Horizon Testnet.
- Displays a receipt with source, destination, amount, memo, transaction hash, and Stellar Expert links.

## Demo Script for Judges

1. Open the live demo.
2. Install Freighter if needed: <https://www.freighter.app/>
3. Switch Freighter to **Stellar Testnet**.
4. Connect Freighter in SplitCare.
5. If the connected account has no testnet XLM, use **Fund with Friendbot**.
6. Create or open another funded Stellar Testnet account to use as the destination.
   - Stellar Laboratory account creator: <https://laboratory.stellar.org/#account-creator?network=test>
7. In SplitCare, pick an expense and adjust the split if desired.
8. Paste the destination public key.
9. Click **Pay my share**.
10. Confirm the transaction in Freighter.
11. Check the receipt and open the Stellar Expert transaction link.
12. Optional: open the Account page and use the Testnet balance checker with any public key.

## Important Testnet Notes

- SplitCare uses **testnet XLM only**. It does not move real funds.
- The destination account must already exist on Stellar Testnet. If it does not exist, Stellar will reject the payment with `op_no_destination`.
- The **Fund with Friendbot** button funds the connected source wallet only. It does not create or fund the destination account.
- Freighter may reconnect a previously approved wallet automatically. To use another wallet, switch accounts inside Freighter or remove the site from Freighter's connected apps.

## Tech Stack

- React + Vite + TypeScript
- `@stellar/stellar-sdk` for Horizon, transaction building, and transaction submission
- `@stellar/freighter-api` for wallet connection and signing
- Vanilla CSS with OKLCH design tokens and responsive layouts

## Project Structure

```text
src/
├─ components/        UI cards, payment flow, wallet display, receipt
├─ data/              Default expense presets
├─ hooks/             Wallet, settings, routing, split state
├─ lib/
│  ├─ freighter.ts    Freighter connection, address, network, signing
│  ├─ stellar.ts      Horizon, balance loading, Friendbot, payment XDR, submit
│  ├─ money.ts        XLM/stroop parsing and formatting
│  └─ split.ts        Exact percentage and stroop splitting logic
├─ pages/             Landing, account, payments, settings
└─ styles/            Design tokens, base styles, app styles
```

## Local Setup

```bash
git clone https://github.com/elithebooo/splitcare.git
cd splitcare
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build Check

```bash
npm run typecheck
npm run build
```

## Screenshots to Include Before Final Submission

Update the `screenshots/` folder with fresh screenshots from the deployed app:

1. Landing page
2. Freighter connect prompt
3. Wallet connected with Testnet balance
4. Account page balance checker
5. Split/payment form with destination address
6. Freighter signature confirmation
7. Successful receipt with transaction hash
8. Stellar Expert transaction page

## Known Limitations

- Freighter is the only wallet integration in this White Belt version.
- The app is intentionally Testnet-only.
- Receipts are stored only for the current browser session.
- Destination accounts must already exist on Testnet before receiving payment.

## Future Improvements

- Add multi-wallet support for Yellow Belt.
- Persist optional local payment history.
- Add deeper transaction status syncing after submission.
- Add real-time event synchronization in the next belt level.
