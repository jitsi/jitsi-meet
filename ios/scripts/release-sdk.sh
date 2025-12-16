#!/bin/bash

set -e -u -x

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
PROJECT_REPO=$(realpath ${THIS_DIR}/../..)
RELEASE_REPO=$(realpath ${THIS_DIR}/../../../jitsi-meet-ios-sdk-releases)
DEFAULT_SDK_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ${THIS_DIR}/../sdk/src/Info.plist)
SDK_VERSION=${OVERRIDE_SDK_VERSION:-${DEFAULT_SDK_VERSION}}

echo "Releasing Jitsi Meet SDK ${SDK_VERSION}"

pushd ${RELEASE_REPO}

# Generate podspec file
cat JitsiMeetSDK.podspec.tpl | sed -e s/VERSION/${SDK_VERSION}/g > JitsiMeetSDK.podspec

# Cleanup
rm -rf Frameworks/*

popd

# Build the SDK
pushd ${PROJECT_REPO}
rm -rf ios/sdk/out
xcodebuild clean \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeetSDK
xcodebuild archive \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeetSDK  \
    -configuration Release \
    -sdk iphonesimulator \
    -destination='generic/platform=iOS Simulator' \
    -archivePath ios/sdk/out/ios-simulator \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
xcodebuild archive \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeetSDK  \
    -configuration Release \
    -sdk iphoneos \
    -destination='generic/platform=iOS' \
    -archivePath ios/sdk/out/ios-device \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
xcodebuild -create-xcframework \
    -framework ios/sdk/out/ios-device.xcarchive/Products/Library/Frameworks/JitsiMeetSDK.framework \
    -framework ios/sdk/out/ios-simulator.xcarchive/Products/Library/Frameworks/JitsiMeetSDK.framework \
    -output ios/sdk/out/JitsiMeetSDK.xcframework
popd

pushd ${RELEASE_REPO}

# Put the new files in the repo
cp -a ${PROJECT_REPO}/ios/sdk/out/JitsiMeetSDK.xcframework Frameworks/
cp -a ${PROJECT_REPO}/ios/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework Frameworks/

# Add all files to git
git add -A .
git commit --allow-empty -m "${SDK_VERSION}"
git tag "${SDK_VERSION}"

popd

echo "Finished! Don't forget to push the tags and releases repo artifacts."
echo "The new pod can be pushed to CocoaPods by doing: pod trunk push JitsiMeetSDK.podspec"
