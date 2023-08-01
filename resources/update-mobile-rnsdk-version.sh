#!/bin/bash

set -e -u

if [[ $# -ne 1 ]]; then
    echo "Please specify a version"
    exit 1
fi

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
CURRENT_VERSION=$(node -p "require('${THIS_DIR}/../react-native-sdk/package.json').version")
VERSION=$1

npm version --prefix ${THIS_DIR}/../react-native-sdk "${VERSION}" --no-git-tag-version

npm install --prefix ${THIS_DIR}/../react-native-sdk

git add .

git commit -m "update version to ${VERSION}"

git push
