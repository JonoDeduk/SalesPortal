#!/usr/bin/env bash
set -euo pipefail

ENV_EXAMPLE=".sandcastle/.env.example"
ENV_OUT=".sandcastle/.env"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "Error: $ENV_EXAMPLE not found." >&2
  exit 1
fi

if [[ -f "$ENV_OUT" ]]; then
  read -r -p ".env already exists. Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
fi

echo "Setting up $ENV_OUT — press Enter to leave a value blank."
echo ""

output=""

while IFS= read -r line || [[ -n "$line" ]]; do
  # Pass through comments and blank lines
  if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
    output+="$line"$'\n'
    continue
  fi

  # Extract key name (everything before the =)
  key="${line%%=*}"
  read -r -p "$key: " value
  output+="${key}=${value}"$'\n'
done < "$ENV_EXAMPLE"

printf "%s" "$output" > "$ENV_OUT"
echo ""
echo "Written to $ENV_OUT"
