# SplitCare Soroban contract

The contract keeps a public, verifiable record of SplitCare expenses and which
member shares have been paid. The frontend pays shares with regular Stellar
XLM payments first, then records the result on-chain; clients sync by
listening to contract events.

## Contract surface

| Function | Auth | Description |
| --- | --- | --- |
| `create_expense(creator, id, title, members)` | creator | Publishes an expense with `(name, amount_stroops)` member shares. Emits `splitcare/created`. |
| `record_payment(id, member_index, payer, tx_hash)` | payer | Marks a member's share as paid and stores the XLM payment hash. Emits `splitcare/paid`. |
| `get_expense(id)` | — (read) | Returns the full expense. |
| `recent_ids()` | — (read) | Newest-first list of recent expense ids (max 25). |

## Events

| Topics | Data |
| --- | --- |
| `("splitcare", "created")` | `(id, creator, title, total, members)` |
| `("splitcare", "paid")` | `(id, member_index, payer, amount, tx_hash)` |

The frontend polls `getEvents` on Soroban RPC and rebuilds expense state from
this stream (see `src/lib/contract.ts` and `src/hooks/useContractEvents.ts`).

## Build and test

Requires Rust (stable) and the
[Stellar CLI](https://developers.stellar.org/docs/tools/cli/stellar-cli):

```bash
cargo install --locked stellar-cli
cd contracts/splitcare
cargo test
stellar contract build
```

## Deploy to Testnet

Easiest: run the repo script, which builds, creates and funds a deployer
identity via Friendbot, deploys, and prints the contract id:

```bash
./scripts/deploy-contract.sh
```

Or trigger the **"Deploy SplitCare contract (Testnet)"** GitHub Action — it
deploys with a throwaway testnet identity and reports the contract id in the
run summary. No secrets needed.

After deploying:

1. Set `VITE_CONTRACT_ID=<contract id>` in `.env` (and in your Vercel env).
2. Record the contract id in the root `README.md`.
3. Publish an expense from the app to produce a verifiable contract-call
   transaction hash.

Manual invocation example:

```bash
stellar contract invoke \
  --id "$VITE_CONTRACT_ID" \
  --source-account splitcare-deployer \
  --network testnet \
  -- get_expense --id "expense_..."
```
