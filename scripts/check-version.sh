#!/bin/bash
set -e

VERSION=$1
NEW_TAG="ivicos_$1"
EXISTING_TAGS_BOOLEAN=$2

if [[ "$EXISTING_TAGS_BOOLEAN" = "true" ]]; then
    echo "A tag '$NEW_TAG' corresponding to the version '$VERSION' already exists."
    echo "Please increment the version in CHANGELOG.md to target a new version compared to master."
    exit 1
else
    echo "The new tag '$NEW_TAG' is valid."
fi