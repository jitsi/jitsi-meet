#!/bin/bash
set -e

VERSION=$1
COMMITTER=$2
EMAIL=$3
RELEASE_BODY=$(echo "$4" | sed -E 's/^### (.*)$/[ \1 ]/' |  sed 's/^-/*/' | sed 's/^/  /')
DISTRIBUTION='stable'
PACKAGE_NAME='jitsi-meet-web'
URGENCY='low'
DATE=$(git log -1 --format="%at" | xargs -I{} date -d @{} '+%a, %d %b %Y %T +0100')

echo "$PACKAGE_NAME ($VERSION) $DISTRIBUTION; urgency=$URGENCY" > "debian/changelog"
echo "" >> "debian/changelog"
echo "$RELEASE_BODY"  >> "debian/changelog"
echo "" >> "debian/changelog"
echo " -- $COMMITTER <$EMAIL>  $DATE" >> "debian/changelog"
echo "" >> "debian/changelog"
