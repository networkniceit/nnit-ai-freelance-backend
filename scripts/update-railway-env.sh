#!/usr/bin/env bash
set -euo pipefail

# Usage:
# export OPENAI_API_KEY="sk-..." \
#   STRIPE_SECRET_KEY="sk_..." \
#   STRIPE_PUBLISHABLE_KEY="pk_..." \
#   STRIPE_WEBHOOK_SECRET="whsec_..." \
#   ./scripts/update-railway-env.sh
#
# This script uses the Railway CLI to set environment variables on two services:
# - NNIT-Server-Restricted
# - NNIT-Scraper-Server
#
# It DOES NOT contain secrets. Pass secrets via environment variables when running.

set_service_var() {
  service="$1"
  key="$2"
  value="$3"
  if [ -z "${value:-}" ]; then
    echo "Skipping $service:$key (no value provided)"
    return
  fi
  echo "Setting $service -> $key"
  railway variables set --service "$service" "$key=$value"
}

echo "Updating Railway variables (requires Railway CLI and auth)..."

# Server (main API)
set_service_var "NNIT-Server-Restricted" "OPENAI_API_KEY" "$OPENAI_API_KEY"
set_service_var "NNIT-Server-Restricted" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
set_service_var "NNIT-Server-Restricted" "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY"
set_service_var "NNIT-Server-Restricted" "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

# Scraper service (only set Stripe if scraper needs payments/webhooks)
set_service_var "NNIT-Scraper-Server" "OPENAI_API_KEY" "$OPENAI_API_KEY"
set_service_var "NNIT-Scraper-Server" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"

echo "Done. Verify variables in Railway dashboard or with 'railway variables list --service <service>'"
#!/usr/bin/env bash
# Template to update Railway environment variables using `railway` CLI.
# Usage: set the RAILWAY_API_KEY env var or login with `railway login`.
# Then run: `./scripts/update-railway-env.sh` and follow prompts.

set -euo pipefail

echo "This is a template. Do NOT commit secrets into the repo."

read -p "Railway project id: " PROJECT_ID
read -p "Service id: " SERVICE_ID

echo "Enter variable name (or blank to finish):"
while true; do
  read -p "Name: " NAME
  if [ -z "$NAME" ]; then
    break
  fi
  read -s -p "Value for $NAME: " VALUE
  echo
  railway variables set -p "$PROJECT_ID" -s "$SERVICE_ID" "$NAME" "$VALUE"
done

echo "Done. Redeploy the service from Railway UI or push an empty commit." 
