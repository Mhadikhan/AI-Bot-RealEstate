#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"

if [[ ! -f .env.evolution ]]; then
  cp .env.evolution.example .env.evolution
  echo "Created .env.evolution — ensure AUTHENTICATION_API_KEY matches EVOLUTION_API_KEY in .env"
fi

docker compose -f docker-compose.evolution.yml up -d
echo ""
echo "Evolution API: http://localhost:8080"
echo "Pair WhatsApp: http://localhost:3000/admin/settings/whatsapp"
