#!/bin/bash

set -e -u


THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
DEFAULT_MVN_REPO="${THIS_DIR}/../../../jitsi-maven-repository/releases"
THE_MVN_REPO=${MVN_REPO:-${1:-$DEFAULT_MVN_REPO}}
MVN_HTTP=0
DEFAULT_SDK_VERSION=$(grep sdkVersion ${THIS_DIR}/../gradle.properties | cut -d"=" -f2)
SDK_VERSION=${OVERRIDE_SDK_VERSION:-${DEFAULT_SDK_VERSION}}

if [[ $THE_MVN_REPO == http* ]]; then
    MVN_HTTP=1
else
    MVN_REPO_PATH=$(realpath $THE_MVN_REPO)
    THE_MVN_REPO="file:${MVN_REPO_PATH}"
fi

export MVN_REPO=$THE_MVN_REPO

echo "Releasing Jitsi Meet SDK ${SDK_VERSION}"
echo "Using ${MVN_REPO} as the Maven repo"

 if [[ $MVN_HTTP == 0 ]]; then
    # Check if an SDK with that same version has already been released
    if [[ -d ${MVN_REPO}/org/jitsi/react/jitsi-meet-sdk/${SDK_VERSION} ]]; then
        echo "There is already a release with that version in the Maven repo!"
        exit 1
    fi
fi

# Now build and publish the Jitsi Meet SDK and its dependencies
echo "Building and publishing the Jitsi Meet SDK"
pushd ${THIS_DIR}/../
./gradlew clean
./gradlew assembleRelease
./gradlew publish
popd

# The artifacts are now on the Maven repo, commit them
if [[ $MVN_HTTP == 0 ]]; then
    pushd ${MVN_REPO_PATH}
    git add -A .
    git commit -m "Jitsi Meet SDK + dependencies: ${SDK_VERSION}"
    popd
fi

# Done!
echo "Finished! Don't forget to push the tag and the Maven repo artifacts."
