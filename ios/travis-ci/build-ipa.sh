cd ios
pod install
cd ..

CERT_DIR="ios/travis-ci/certs"

mkdir $CERT_DIR

curl -L -o ${CERT_DIR}/AppleWWDRCA1.cer 'http://developer.apple.com/certificationauthority/AppleWWDRCA.cer'
curl -L -o ${CERT_DIR}/dev-cert.cer.enc ${IOS_DEV_CERT_URL}
curl -L -o ${CERT_DIR}/dev-key.p12.enc ${IOS_DEV_CERT_KEY_URL}
curl -L -o ${CERT_DIR}/dev-profile.mobileprovision.enc ${IOS_DEV_PROV_PROFILE_URL}

openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-cert.cer.enc -d -a -out ${CERT_DIR}/dev-cert.cer
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-key.p12.enc -d -a -out ${CERT_DIR}/dev-key.p12
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-profile.mobileprovision.enc -d -a -out ${CERT_DIR}/dev-profile.mobileprovision


security create-keychain -p $ENCRYPTION_PASSWORD ios-build.keychain
security default-keychain -s ios-build.keychain
security unlock-keychain -p $ENCRYPTION_PASSWORD ios-build.keychain
security set-keychain-settings -t 3600 -l ~/Library/Keychains/ios-build.keychain


security import ${CERT_DIR}/AppleWWDRCA.cer -k ios-build.keychain -A
security import ${CERT_DIR}/dev-cert.cer -k ios-build.keychain -A
security import ${CERT_DIR}/dev-key.p12 -k ios-build.keychain -P "$IOS_SIGNING_CERT_PASSWORD" -A

# Fix for OS X Sierra that hungs in the codesign step
security set-key-partition-list -S apple-tool:,apple: -s -k "$IOS_SIGNING_CERT_PASSWORD" ios-build.keychain > /dev/null

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

cp "${CERT_DIR}/dev-profile.mobileprovision"  ~/Library/MobileDevice/Provisioning\ Profiles/

mkdir -p /tmp/jitsi-meet/

xcodebuild archive -workspace ios/jitsi-meet.xcworkspace -scheme jitsi-meet -configuration Release -archivePath /tmp/jitsi-meet/jitsi-meet.xcarchive

sed -e "s/YOUR_TEAM_ID/${IOS_TEAM_ID}/g" ios/travis-ci/build-ipa.plist.template > ios/travis-ci/build-ipa.plist

xcodebuild -exportArchive -archivePath /tmp/jitsi-meet/jitsi-meet.xcarchive -exportPath /tmp/jitsi-meet/jitsi-meet-ipa -exportOptionsPlist ios/travis-ci/build-ipa.plist
