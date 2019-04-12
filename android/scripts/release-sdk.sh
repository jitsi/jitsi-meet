#!/bin/bash

set -e -u


THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
DEFAULT_MVN_REPO="${THIS_DIR}/../../../jitsi-maven-repository/releases"
THE_MVN_REPO=${MVN_REPO:-${1:-$DEFAULT_MVN_REPO}}
MVN_HTTP=0
DEFAULT_SDK_VERSION=$(grep sdkVersion ${THIS_DIR}/../gradle.properties | cut -d"=" -f2)
SDK_VERSION=${OVERRIDE_SDK_VERSION:-${DEFAULT_SDK_VERSION}}
RN_VERSION=$(jq -r '.dependencies."react-native"' ${THIS_DIR}/../../package.json)

if [[ $THE_MVN_REPO == http* ]]; then
    MVN_HTTP=1
else
    MVN_REPO_PATH=$(realpath $THE_MVN_REPO)
    THE_MVN_REPO="file:${MVN_REPO_PATH}"
fi

export MVN_REPO=$THE_MVN_REPO

echo "Releasing Jitsi Meet SDK ${SDK_VERSION}"
echo "Using ${MVN_REPO} as the Maven repo"

if [[ $MVN_HTTP == 1 ]]; then
    # Push React Native
    echo "Pushing React Native ${RN_VERSION} to the Maven repo"
    pushd ${THIS_DIR}/../../node_modules/react-native/android/com/facebook/react/react-native/${RN_VERSION}
    mvn \
        deploy:deploy-file \
        -Durl=${MVN_REPO} \
        -DrepositoryId=${MVN_REPO_ID} \
        -Dfile=react-native-${RN_VERSION}.aar \
        -Dpackaging=aar \
        -DgeneratePom=false \
        -DpomFile=react-native-${RN_VERSION}.pom || true
    popd
else
    # Check if an SDK with that same version has already been released
    if [[ -d ${MVN_REPO}/org/jitsi/react/jitsi-meet-sdk/${SDK_VERSION} ]]; then
        echo "There is already a release with that version in the Maven repo!"
        exit 1
    fi

    # First push React Native, if necessary
    if [[ ! -d ${MVN_REPO}/com/facebook/react/react-native/${RN_VERSION} ]]; then
        echo "Pushing React Native ${RN_VERSION} to the Maven repo"
        pushd ${THIS_DIR}/../../node_modules/react-native/android/com/facebook/react/react-native/${RN_VERSION}
        mvn \
            deploy:deploy-file \
            -Durl=${MVN_REPO} \
            -Dfile=react-native-${RN_VERSION}.aar \
            -Dpackaging=aar \
            -DgeneratePom=false \
            -DpomFile=react-native-${RN_VERSION}.pom
        popd
    fi
fi

# Now build and publish the Jitsi Meet SDK and its dependencies
echo "Building and publishing the Jitsi Meet SDK"
pushd ${THIS_DIR}/../
./gradlew clean assembleRelease publish
popd

if [[ $MVN_HTTP == 0 ]]; then
    # The artifacts are now on the Maven repo, commit them
    pushd ${MVN_REPO_PATH}
    if [[ "$(git rev-parse --is-inside-work-tree 2>/dev/null)" == "true" ]]; then
        git add -A .
        git commit -m "Jitsi Meet SDK + dependencies"
    fi
    popd

    # Tag the release
    git tag -a android-sdk-${SDK_VERSION}
fi

# Done!
echo "Finished! Don't forget to push the tag and the Maven repo artifacts."
