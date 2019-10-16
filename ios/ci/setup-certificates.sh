# The script is based on tutorial written by Antonis Tsakiridis published at:
# https://medium.com/@atsakiridis/continuous-deployment-for-ios-using-travis-ci-55dcea342d9
#
# APPLE_CERT_URL - the URL pointing to Apple certificate (set to
# http://developer.apple.com/certificationauthority/AppleWWDRCA.cer by default)
# DEPLOY_SSH_CERT_URL - the SSH private key used by the 'scp' command to deploy
# the .ipa. It is expected to be encrypted with the $ENCRYPTION_PASSWORD.
# ENCRYPTION_PASSWORD - the password used to decrypt certificate/key files used
# in the script.
# IOS_DEV_CERT_KEY_URL - URL pointing to provisioning profile certificate key
# file (development-key.p12.enc from the tutorial) encrypted with the
# $ENCRYPTION_PASSWORD.
# IOS_DEV_CERT_URL - URL pointing to provisioning profile certificate file
# (development-cert.cer.enc from the tutorial) encrypted with the
# $ENCRYPTION_PASSWORD.
# IOS_DEV_PROV_PROFILE_URL - URL pointing to provisioning profile file
# (profile-development-olympus.mobileprovision.enc from the tutorial) encrypted
# IOS_DEV_WATCH_PROV_PROFILE_URL - URL pointing to watch app provisioning profile file(encrypted).
# with the $ENCRYPTION_PASSWORD.
# IOS_SIGNING_CERT_PASSWORD - the password to the provisioning profile
# certificate key (used to open development-key.p12 from the tutorial).

function echoAndExit1() {
    echo $1
    exit 1
}

CERT_DIR=$1

if [ -z $CERT_DIR ]; then
  echoAndExit1 "First argument must be certificates directory"
fi

if [ -z $APPLE_CERT_URL ]; then
    APPLE_CERT_URL="http://developer.apple.com/certificationauthority/AppleWWDRCA.cer"
fi

if [ -z $DEPLOY_SSH_CERT_URL ]; then
  echoAndExit1 "DEPLOY_SSH_CERT_URL env var is not defined"
fi

if [ -z $ENCRYPTION_PASSWORD ]; then
  echoAndExit1 "ENCRYPTION_PASSWORD env var is not defined"
fi

if [ -z $IOS_DEV_CERT_KEY_URL ]; then
  echoAndExit1 "IOS_DEV_CERT_KEY_URL env var is not defined"
fi

if [ -z $IOS_DEV_CERT_URL ]; then
  echoAndExit1 "IOS_DEV_CERT_URL env var is not defined"
fi

if [ -z $IOS_DEV_PROV_PROFILE_URL ]; then
  echoAndExit1 "IOS_DEV_PROV_PROFILE_URL env var is not defined"
fi

if [ -z $IOS_DEV_WATCH_PROV_PROFILE_URL ]; then
  echoAndExit1 "IOS_DEV_WATCH_PROV_PROFILE_URL env var is not defined"
fi

if [ -z $IOS_SIGNING_CERT_PASSWORD ]; then
  echoAndExit1 "IOS_SIGNING_CERT_PASSWORD env var is not defined"
fi

# certificates

curl -L -o ${CERT_DIR}/AppleWWDRCA.cer 'http://developer.apple.com/certificationauthority/AppleWWDRCA.cer'
curl -L -o ${CERT_DIR}/dev-cert.cer.enc ${IOS_DEV_CERT_URL}
curl -L -o ${CERT_DIR}/dev-key.p12.enc ${IOS_DEV_CERT_KEY_URL}
curl -L -o ${CERT_DIR}/dev-profile.mobileprovision.enc ${IOS_DEV_PROV_PROFILE_URL}
curl -L -o ${CERT_DIR}/dev-watch-profile.mobileprovision.enc ${IOS_DEV_WATCH_PROV_PROFILE_URL}


openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-cert.cer.enc -d -a -out ${CERT_DIR}/dev-cert.cer
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-key.p12.enc -d -a -out ${CERT_DIR}/dev-key.p12
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-profile.mobileprovision.enc -d -a -out ${CERT_DIR}/dev-profile.mobileprovision
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/dev-watch-profile.mobileprovision.enc -d -a -out ${CERT_DIR}/dev-watch-profile.mobileprovision

security create-keychain -p $ENCRYPTION_PASSWORD ios-build.keychain
security default-keychain -s ios-build.keychain
security unlock-keychain -p $ENCRYPTION_PASSWORD ios-build.keychain
security set-keychain-settings -t 3600 -l ~/Library/Keychains/ios-build.keychain

echo "importing Apple cert"
security import ${CERT_DIR}/AppleWWDRCA.cer -k ios-build.keychain -A
echo "importing dev-cert.cer"
security import ${CERT_DIR}/dev-cert.cer -k ios-build.keychain -A
echo "importing dev-key.p12"
security import ${CERT_DIR}/dev-key.p12 -k ios-build.keychain -P $IOS_SIGNING_CERT_PASSWORD -A

echo "will set-key-partition-list"
# Fix for OS X Sierra that hungs in the codesign step
security set-key-partition-list -S apple-tool:,apple: -s -k $ENCRYPTION_PASSWORD ios-build.keychain > /dev/null
echo "done set-key-partition-list"

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

cp "${CERT_DIR}/dev-profile.mobileprovision"  ~/Library/MobileDevice/Provisioning\ Profiles/
cp "${CERT_DIR}/dev-watch-profile.mobileprovision"  ~/Library/MobileDevice/Provisioning\ Profiles/
