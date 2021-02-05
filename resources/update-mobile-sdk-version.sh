#!/bin/bash

set -e -u

if [[ $# -ne 1 ]]; then
    echo "Please specify a version"
    exit 1
fi

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
VERSION=$1

# iOS
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${VERSION}" ${THIS_DIR}/../ios/sdk/src/Info.plist

# Android
sed -i "" -e "s/sdkVersion=.*/sdkVersion=${VERSION}/" ${THIS_DIR}/../android/gradle.properties
