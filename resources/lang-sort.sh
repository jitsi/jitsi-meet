#!/bin/bash -e

# Set the options here too: the ones on the shebang line are ignored when the
# script is run as "bash lang-sort.sh", and then a missing or failing jq would
# replace every language file with empty output.
set -euo pipefail

if ! command -v jq > /dev/null; then
  echo "lang-sort.sh: jq is required but was not found in PATH" >&2
  exit 1
fi

t=""
trap 'rm -f "${t}"' EXIT

for file in ./lang/*.json; do
  echo "Sorting and standardizing ${file}"
  t=$(mktemp)
  jq --indent 4 -S "." "${file}" > "${t}"
  mv "${t}" "${file}"
done
