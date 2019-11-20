#!/bin/bash

set -e -u

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
PROJECT_REPO=$(realpath ${THIS_DIR}/../..)
RELEASE_REPO=$(realpath ${THIS_DIR}/../../../jitsi-meet-ios-sdk-releases)
DEFAULT_SDK_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ${THIS_DIR}/../sdk/src/Info.plist)
SDK_VERSION=${OVERRIDE_SDK_VERSION:-${DEFAULT_SDK_VERSION}}
DO_GIT_TAG=${GIT_TAG:-0}


echo "Releasing Jitsi Meet SDK ${SDK_VERSION}"

pushd ${RELEASE_REPO}

# Generate podspec file
cat JitsiMeetSDK.podspec.tpl | sed -e s/VERSION/${SDK_VERSION}/g > JitsiMeetSDK.podspec

# Cleanup
rm -rf Frameworks/*

popd

# Build the SDK
pushd ${PROJECT_REPO}
rm -rf ios/sdk/JitsiMeet.framework
xcodebuild -workspace ios/jitsi-meet.xcworkspace -scheme JitsiMeet -destination='generic/platform=iOS' -configuration Release ENABLE_BITCODE=NO clean archive
if [[ $DO_GIT_TAG == 1 ]]; then
    git tag ios-sdk-${SDK_VERSION}
fi
popd

pushd ${RELEASE_REPO}

# Put the new files in the repo
cp -r ${PROJECT_REPO}/ios/sdk/JitsiMeet.framework Frameworks/
cp -r ${PROJECT_REPO}/node_modules/react-native-webrtc/ios/WebRTC.framework Frameworks/

# Strip bitcode
xcrun bitcode_strip -r Frameworks/JitsiMeet.framework/JitsiMeet -o Frameworks/JitsiMeet.framework/JitsiMeet
xcrun bitcode_strip -r Frameworks/WebRTC.framework/WebRTC -o Frameworks/WebRTC.framework/WebRTC

# Add all files to git
if [[ $DO_GIT_TAG == 1 ]]; then
    git add -A .
    git commit -m "${SDK_VERSION}"
    git tag ${SDK_VERSION}
fi

popd

echo "Finished! Don't forget to push the tags and releases repo artifacts."
echo "The new pod can be pushed to CocoaPods by doing: pod trunk push JitsiMeetSDK.podspec"
