#!/bin/bash -e

for file in ./lang/*.json; do
  echo "Sorting and standardizing ${file}"
  t=$(mktemp)
  jq --indent 4 -S "." "${file}" > "${t}"
  mv "${t}" "${file}"
done
