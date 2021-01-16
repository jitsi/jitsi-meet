#!/bin/bash

set -e -u


THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
DEFAULT_MVN_REPO="${THIS_DIR}/../../../jitsi-maven-repository/releases"
THE_MVN_REPO=${MVN_REPO:-${1:-$DEFAULT_MVN_REPO}}
MVN_HTTP=0
DEFAULT_SDK_VERSION=$(grep sdkVersion ${THIS_DIR}/../gradle.properties | cut -d"=" -f2)
SDK_VERSION=${OVERRIDE_SDK_VERSION:-${DEFAULT_SDK_VERSION}}
RN_VERSION=$(jq -r '.version' ${THIS_DIR}/../../node_modules/react-native/package.json)
JSC_VERSION="r"$(jq -r '.dependencies."jsc-android"' ${THIS_DIR}/../../node_modules/react-native/package.json | cut -d . -f 1 | cut -c 2-)
DO_GIT_TAG=${GIT_TAG:-0}

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
    # Push JSC
    echo "Pushing JSC ${JSC_VERSION} to the Maven repo"
    pushd ${THIS_DIR}/../../node_modules/jsc-android/dist/org/webkit/android-jsc/${JSC_VERSION}
    mvn \
        deploy:deploy-file \
        -Durl=${MVN_REPO} \
        -DrepositoryId=${MVN_REPO_ID} \
        -Dfile=android-jsc-${JSC_VERSION}.aar \
        -Dpackaging=aar \
        -DgeneratePom=false \
        -DpomFile=android-jsc-${JSC_VERSION}.pom || true
    popd
else
    # Push React Native, if necessary
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

    # Push JSC, if necessary
    if [[ ! -d ${MVN_REPO}/org/webkit/android-jsc/${JSC_VERSION} ]]; then
        echo "Pushing JSC ${JSC_VERSION} to the Maven repo"
        pushd ${THIS_DIR}/../../node_modules/jsc-android/dist/org/webkit/android-jsc/${JSC_VERSION}
        mvn \
            deploy:deploy-file \
            -Durl=${MVN_REPO} \
            -Dfile=android-jsc-${JSC_VERSION}.aar \
            -Dpackaging=aar \
            -DgeneratePom=false \
            -DpomFile=android-jsc-${JSC_VERSION}.pom
        popd
    fi

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

if [[ $DO_GIT_TAG == 1 ]]; then
    # The artifacts are now on the Maven repo, commit them
    pushd ${MVN_REPO_PATH}
    git add -A .
    git commit -m "Jitsi Meet SDK + dependencies: ${SDK_VERSION}"
    popd

    # Tag the release
    git tag android-sdk-${SDK_VERSION}
fi

# Done!
echo "Finished! Don't forget to push the tag and the Maven repo artifacts."
