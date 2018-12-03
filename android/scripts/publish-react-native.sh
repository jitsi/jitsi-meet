#!/bin/bash

CWD=$(dirname $0)
MVN_REPO=$(realpath $1)
RN_VERSION=$(jq -r '.dependencies."react-native"' ${CWD}/../../package.json)

pushd ${CWD}/../../node_modules/react-native/android/com/facebook/react/react-native/${RN_VERSION}

mvn \
    deploy:deploy-file \
    -Durl=file://${MVN_REPO} \
    -Dfile=react-native-${RN_VERSION}.aar \
    -Dpackaging=aar \
    -Dsources=react-native-${RN_VERSION}-sources.jar \
    -Djavadoc=react-native-${RN_VERSION}-javadoc.jar \
    -DgeneratePom=false \
    -DpomFile=react-native-${RN_VERSION}.pom

popd
