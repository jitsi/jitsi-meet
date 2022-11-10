#!/bin/bash

BASE_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[1]}" || echo "${BASH_SOURCE[1]}")")" && pwd)
ARCHIVE_DIR=$BASE_DIR/JitsiMeet.xcarchive
APP_DIR=$ARCHIVE_DIR/Products/Applications/jitsi-meet.app


echo "Cleaning up old archive & app..."
rm -rf $ARCHIVE_DIR $APP_DIR

echo "Cleaning up workspace..."
xcodebuild clean \
    -workspace $BASE_DIR/ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet

echo "Building archive..."
xcodebuild archive \
    -workspace $BASE_DIR/ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet \
    -allowProvisioningUpdates \
    -destination 'generic/platform=iOS' \
    -configuration Release \
    -archivePath $ARCHIVE_DIR

echo "Exporting archive..."
xcodebuild -exportArchive \
     -archivePath $ARCHIVE_DIR  \
     -exportOptionsPlist $BASE_DIR/ios/app/src/Info.plist \
     -exportPath $BASE_DIR \

echo "Done"
