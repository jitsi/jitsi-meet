REAL_ARCHIVE_PATH=$(dirname ${ARCHIVE_PRODUCTS_PATH})

rm -rf ios/app/out
xcodebuild clean \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet
xcodebuild archive \
    -workspace ios/jitsi-meet.xcworkspace \
    -scheme JitsiMeet \
    -configuration Release \
    -destination='generic/platform=iOS' \
    -archivePath $REAL_ARCHIVE_PATH
xcodebuild -exportArchive \
     -archivePath $REAL_ARCHIVE_PATH \
     -exportPath /jitsi-meet \
     -exportOptionsPlist ios/app/src/Info.plist
xcodebuild -create-xcarchive \
    -archive ios/app/out/JitsiMeet.xcarchive \
    -output ios/app/out/JitsiMeet.xcarchive/Products/Applications/jitsi-meet.app
