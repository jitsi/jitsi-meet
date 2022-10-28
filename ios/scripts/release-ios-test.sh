#!/bin/bash

set -e -u

rm -rf ios/app/out
xcodebuild clean \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet
xcodebuild archive \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet \
    -configuration Release \
    -destination='generic/platform=iOS' \
    -archivePath ios/app/out/ios-device
xcodebuild -exportArchive \
     -archivePath ios/app/out/ios-device \
     -exportPath ios/app/out \
     -exportOptionsPlist ios/app/src/Info.plist
xcodebuild -create-xcarchive \
    -archive ios/app/out/ios-device.xcarchive/Products/Applications/jitsi-meet.app \
    -output ios/app/out/jitsi-meet.app
