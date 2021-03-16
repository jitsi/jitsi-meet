#!/bin/bash
set -e

# Mandatory arguments with no default values provided:
# PR_REPO_SLUG - the Github name of the repo to be merged into the origin/master
# PR_BRANCH - the branch to be merged, if set to "master" no merge will happen
# IPA_DEPLOY_LOCATION - the location understandable by the "scp" command
# executed at the end of the script to deploy the output .ipa file
# LIB_JITSI_MEET_PKG (optional) - the npm package for lib-jitsi-meet which will
# be put in place of the current version in the package.json file.
#
# Other than that the script requires the following env variables to be set:
#
# DEPLOY_SSH_CERT_URL - the SSH private key used by the 'scp' command to deploy
# the .ipa. It is expected to be encrypted with the $ENCRYPTION_PASSWORD.
# ENCRYPTION_PASSWORD - the password used to decrypt certificate/key files used
# in the script.
# IOS_TEAM_ID - the team ID inserted into build-ipa-.plist.template file in
# place of "YOUR_TEAM_ID".

function echoAndExit1() {
    echo $1
    exit 1
}

if [ -z $PR_REPO_SLUG ]; then
    echoAndExit1 "No PR_REPO_SLUG defined"
fi
if [ -z $PR_BRANCH ]; then
    echoAndExit1 "No PR_BRANCH defined"
fi
if [ -z $IPA_DEPLOY_LOCATION ]; then
    echoAndExit1 "No IPA_DEPLOY_LOCATION defined"
fi

echo "PR_REPO_SLUG=${PR_REPO_SLUG} PR_BRANCH=${PR_BRANCH}"

# do the merge and git log

if [ $PR_BRANCH != "master" ]; then
    echo "Will merge ${PR_REPO_SLUG}/${PR_BRANCH} into master"
    git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
    git fetch origin master
    git checkout master
    git pull https://github.com/${PR_REPO_SLUG}.git $PR_BRANCH --no-edit
fi

# Link this lib-jitsi-meet checkout in jitsi-meet through the package.json
if [ ! -z ${LIB_JITSI_MEET_PKG} ];
then
    echo "Adjusting lib-jitsi-meet package in package.json to ${LIB_JITSI_MEET_PKG}"
    # escape for the sed
    LIB_JITSI_MEET_PKG=$(echo $LIB_JITSI_MEET_PKG | sed -e 's/\\/\\\\/g; s/\//\\\//g; s/&/\\\&/g')
    sed -i.bak -e "s/\"lib-jitsi-meet.*/\"lib-jitsi-meet\"\: \"${LIB_JITSI_MEET_PKG}\",/g" package.json
    echo "Package.json lib-jitsi-meet line:"
    grep lib-jitsi-meet package.json
else
    echo "LIB_JITSI_MEET_PKG var not set - will not modify the package.json"
fi

git log -20 --graph --pretty=format':%C(yellow)%h%Cblue%d%Creset %s %C(white) %an, %ar%Creset'

# certificates

CERT_DIR="ios/ci/certs"

mkdir -p $CERT_DIR

curl -L -o ${CERT_DIR}/id_rsa.enc ${DEPLOY_SSH_CERT_URL}
openssl aes-256-cbc -k "$ENCRYPTION_PASSWORD" -in ${CERT_DIR}/id_rsa.enc -d -a -out ${CERT_DIR}/id_rsa
chmod 0600 ${CERT_DIR}/id_rsa
ssh-add ${CERT_DIR}/id_rsa

npm install

# Ever since the Apple Watch app has been added the bitcode for WebRTC needs to be downloaded in order to build successfully
./node_modules/react-native-webrtc/tools/downloadBitcode.sh

cd ios
pod install --repo-update --no-ansi
cd ..

mkdir -p /tmp/jitsi-meet/

xcodebuild archive -quiet -workspace ios/jitsi-meet.xcworkspace -scheme jitsi-meet -configuration Release -archivePath /tmp/jitsi-meet/jitsi-meet.xcarchive

sed -e "s/YOUR_TEAM_ID/${IOS_TEAM_ID}/g" ios/ci/build-ipa.plist.template > ios/ci/build-ipa.plist

IPA_EXPORT_DIR=/tmp/jitsi-meet/jitsi-meet-ipa

xcodebuild -quiet -exportArchive -archivePath /tmp/jitsi-meet/jitsi-meet.xcarchive -exportPath $IPA_EXPORT_DIR  -exportOptionsPlist ios/ci/build-ipa.plist

echo "Will try deploy the .ipa to: ${IPA_DEPLOY_LOCATION}"

if [ ! -z ${SCP_PROXY_HOST} ];
then
    scp -o ProxyCommand="ssh -t -A -l %r ${SCP_PROXY_HOST} -o \"StrictHostKeyChecking no\" -o \"BatchMode yes\" -W %h:%p"  -o StrictHostKeyChecking=no -o LogLevel=DEBUG "${IPA_EXPORT_DIR}/jitsi-meet.ipa" "${IPA_DEPLOY_LOCATION}"
else
    scp -o StrictHostKeyChecking=no -o LogLevel=DEBUG "${IPA_EXPORT_DIR}/jitsi-meet.ipa" "${IPA_DEPLOY_LOCATION}"
fi

rm -r /tmp/jitsi-meet/
rm -r $CERT_DIR
