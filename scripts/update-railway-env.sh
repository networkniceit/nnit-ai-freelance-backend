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
