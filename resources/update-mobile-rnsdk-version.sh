#!/bin/bash

set -e -u

if [[ $# -ne 1 ]]; then
    echo "Please specify a version"
    exit 1
fi

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
VERSION=$1

pushd ${THIS_DIR}/../react-native-sdk

npm version "${VERSION}" --no-git-tag-version --allow-same-version
node update_sdk_dependencies.js
npm install
npm audit fix

popd
