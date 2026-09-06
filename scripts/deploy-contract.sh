#!/usr/bin/env bash
# Deploys the SplitCare Soroban contract to Stellar Testnet.
#
# Prerequisites:
#   - Rust toolchain: https://rustup.rs
#   - Stellar CLI:    cargo install --locked stellar-cli
#
# Usage:
#   ./scripts/deploy-contract.sh
#   NETWORK=testnet IDENTITY=my-deployer ./scripts/deploy-contract.sh
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-splitcare-deployer}"

echo "==> Checking stellar CLI"
if ! command -v stellar >/dev/null 2>&1; then
  echo "stellar CLI not found. Install it with: cargo install --locked stellar-cli" >&2
  exit 1
fi

echo "==> Building contract (contracts/splitcare)"
(cd contracts/splitcare && stellar contract build)

WASM_PATH="$(find target contracts -name 'splitcare.wasm' -path '*release*' 2>/dev/null | head -n 1 || true)"
if [ -z "$WASM_PATH" ]; then
  echo "Could not find the built splitcare.wasm" >&2
  exit 1
fi
echo "    wasm: $WASM_PATH"

echo "==> Preparing deployer identity '$IDENTITY' on $NETWORK (Friendbot)"
if ! stellar keys address "$IDENTITY" >/dev/null 2>&1; then
  stellar keys generate "$IDENTITY" --network "$NETWORK" --fund
else
  stellar keys fund "$IDENTITY" --network "$NETWORK" || true
fi

echo "==> Deploying contract"
CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source-account "$IDENTITY" \
  --network "$NETWORK")"

echo ""
echo "SplitCare contract deployed on $NETWORK:"
echo "  $CONTRACT_ID"
echo ""
echo "Next steps:"
echo "  1. echo \"VITE_CONTRACT_ID=$CONTRACT_ID\" >> .env"
echo "  2. Record the contract id in README.md (Level 2 section)"
echo "  3. Publish an expense from the app to produce a verifiable contract-call tx hash"
