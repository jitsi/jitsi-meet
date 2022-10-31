#!/bin/bash

BASE_DIR=$HOME/Work/jitsi-meet/ios/
BUILD_DIR=$BASE_DIR/build
FOCUS_ARCHIVE=$BUILD_DIR/JitsiMeet.xcarchive
FOCUS_APP=$BUILD_DIR/jitsi-meet.app


echo "Cleaning up old archive & app..."
rm -rf $FOCUS_ARCHIVE $FOCUS_APP

echo "Cleaning up workspace..."
xcodebuild clean \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet

echo "Building archive..."
xcodebuild archive \
    -workspace $BASE_DIR/jitsi-meet.xcworkspace \
    -scheme JitsiMeet \
    -sdk iphoneos \
    -destination='generic/platform=iOS' \
    -configuration Release \
    -archivePath $FOCUS_ARCHIVE

echo "Exporting archive..."
xcodebuild -exportArchive \
     -archivePath $FOCUS_ARCHIVE  \
     -exportPath $BUILD_DIR \
     -exportOptionsPlist $BASE_DIR/app/src/Info.plist

echo "Done"
