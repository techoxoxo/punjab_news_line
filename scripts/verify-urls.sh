#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${SITE_URL:-https://punjabnewsline.com}"
INPUT_FILE="${1:-audit/all-urls.txt}"
OUTPUT_FILE="${2:-audit/url-verification-failures.txt}"

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Input file not found: $INPUT_FILE" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"
> "$OUTPUT_FILE"

checked=0
failed=0

while IFS= read -r raw || [[ -n "$raw" ]]; do
  url_path="$(echo "$raw" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  [[ -z "$url_path" ]] && continue
  [[ "${url_path:0:1}" == "#" ]] && continue

  if [[ "${url_path:0:1}" != "/" ]]; then
    url_path="/$url_path"
  fi

  status="$(curl -sS -o /dev/null -w "%{http_code}" "$SITE_URL$url_path" || echo "000")"
  checked=$((checked + 1))

  if [[ "$status" != "200" && "$status" != "301" ]]; then
    echo -e "$status\t$url_path" >> "$OUTPUT_FILE"
    failed=$((failed + 1))
  fi
done < "$INPUT_FILE"

echo "Checked: $checked"
echo "Failed:  $failed"
echo "Report:  $OUTPUT_FILE"

if [[ "$failed" -gt 0 ]]; then
  exit 2
fi
