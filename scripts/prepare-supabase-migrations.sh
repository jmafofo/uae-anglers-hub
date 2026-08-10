#!/usr/bin/env bash
set -euo pipefail

destination=${1:?Usage: prepare-supabase-migrations.sh DESTINATION}
source_dir="supabase/migrations"

mkdir -p "$destination/migrations"

found=0
while IFS= read -r migration; do
  cp "$migration" "$destination/migrations/"
  found=1
done < <(find "$source_dir" -maxdepth 1 -type f -name '*.sql' \
  | awk -F/ '$NF ~ /^[0-9]{14}_[a-z0-9_]+\.sql$/' \
  | sort)

if [ "$found" -eq 0 ]; then
  echo "No tracked migrations found. Expected supabase/migrations/YYYYMMDDHHMMSS_name.sql" >&2
  exit 1
fi

echo "Tracked migrations:"
find "$destination/migrations" -maxdepth 1 -type f -name '*.sql' -print | sort
