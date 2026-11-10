#!/bin/bash
# Se corre UNA sola vez, desde la raíz del repo:   bash infra/instalar-respaldo.sh
# Hace tres cosas en la cuenta de GitHub con la que está logueado `gh`:
#   1. Crea el repositorio PRIVADO terrafleet-respaldos con la tarea de respaldo diario.
#   2. Guarda la cadena de conexión de la base como secreto en ese repo y en
#      terrafleet-prueba (ahí la usan las pruebas automáticas de cada publicación).
#   3. Lanza el primer respaldo.
# La cadena de conexión sale de .env (SUPABASE_DB_URL); nunca se muestra en pantalla.
set -euo pipefail
cd "$(dirname "$0")/.."
OWNER="$(gh api user --jq .login)"
REPO="$OWNER/terrafleet-respaldos"
APP="$OWNER/terrafleet-prueba"

URL="$(grep '^SUPABASE_DB_URL=' .env | cut -d= -f2-)"
ANON="$(grep '^SUPABASE_ANON_KEY=' .env | cut -d= -f2-)"
SBURL="$(grep '^SUPABASE_URL=' .env | cut -d= -f2-)"
[ -n "$URL" ] || { echo "Falta SUPABASE_DB_URL en .env"; exit 1; }

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  T="$(mktemp -d)"
  mkdir -p "$T/.github/workflows" "$T/respaldos"
  cp infra/respaldos/respaldo.yml "$T/.github/workflows/respaldo.yml"
  cp infra/respaldos/README.md "$T/README.md"
  touch "$T/respaldos/.gitkeep"
  ( cd "$T" && git init -q -b main && git add -A && git commit -q -m "Respaldo diario de la base de TerraFleet" \
    && gh repo create "$REPO" --private --source=. --push --description "Respaldos diarios de la base de TerraFleet (privado)" )
  echo "Repositorio privado creado: $REPO"
else
  echo "El repositorio $REPO ya existe: no se toca."
fi

printf '%s' "$URL"   | gh secret set SUPABASE_DB_URL   -R "$REPO"
printf '%s' "$URL"   | gh secret set SUPABASE_DB_URL   -R "$APP"
printf '%s' "$SBURL" | gh secret set SUPABASE_URL      -R "$APP"
printf '%s' "$ANON"  | gh secret set SUPABASE_ANON_KEY -R "$APP"
echo "Secretos guardados."

gh workflow run respaldo.yml -R "$REPO"
echo "Primer respaldo lanzado. En un par de minutos, mirá:  gh run list -R $REPO --limit 1"
