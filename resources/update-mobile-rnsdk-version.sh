#!/bin/bash

set -e -u

if [[ $# -ne 1 ]]; then
    echo "Please specify a version"
    exit 1
fi

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
VERSION=$1

npm version --prefix ${THIS_DIR}/../react-native-sdk "${VERSION}" --no-git-tag-version

npm install --prefix ${THIS_DIR}/../react-native-sdk

# Run it once more in case dependencies were updated.
npm install --prefix ${THIS_DIR}/../react-native-sdk

