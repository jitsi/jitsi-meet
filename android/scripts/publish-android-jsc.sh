#!/bin/bash

CWD=$(dirname $0)
MVN_REPO=$(realpath $1)
JSC_VERSION="r"$(jq -r '.dependencies."jsc-android"' ${CWD}/../../package.json | cut -d . -f 1)

pushd ${CWD}/../../node_modules/jsc-android/dist/org/webkit/android-jsc/${JSC_VERSION}

mvn \
    deploy:deploy-file \
    -Durl=file://${MVN_REPO} \
    -Dfile=android-jsc-${JSC_VERSION}.aar \
    -Dpackaging=aar \
    -DgeneratePom=false \
    -DpomFile=android-jsc-${JSC_VERSION}.pom

popd
