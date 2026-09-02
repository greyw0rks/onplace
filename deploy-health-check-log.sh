#!/bin/bash
set -e

# Key is read from the environment, never hardcoded. Set it in .env (gitignored):
#   HEALTH_CHECK_LOG_DEPLOYER_KEY=0x...
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "$HEALTH_CHECK_LOG_DEPLOYER_KEY" ]; then
  echo "error: HEALTH_CHECK_LOG_DEPLOYER_KEY is not set (add it to .env)" >&2
  exit 1
fi

RPC_URL="${BSC_RPC_URL:-https://bsc-dataseed1.bnbchain.org}"

echo "Deploying HealthCheckLog to BSC mainnet..."
forge create contracts/HealthCheckLog.sol:HealthCheckLog \
  --rpc-url "$RPC_URL" \
  --private-key "$HEALTH_CHECK_LOG_DEPLOYER_KEY" \
  --legacy

echo "Deployment complete!"
