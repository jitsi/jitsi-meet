#!/bin/bash

# Builds the jitsi-meet debian packages and the source tarball.
#
# Usage: BUILD_NUMBER=<n> resources/build_deb_package.sh
#
# Requires: nvm (or node matching .nvmrc in PATH), devscripts (dch), debhelper, fakeroot.
#
# Results are left in the parent directory of the checkout:
#   jitsi-meet*_1.0.<n>-1_all.{deb,changes,buildinfo}
#   jitsi-meet-1.0.<n>.tar.bz2
#   build_versions.properties   (NEW_COMPONENT_NAME, NEW_COMPONENT_VER, LIB_JITSI_MEET_VERSION)

set -e -u

: "${BUILD_NUMBER:?BUILD_NUMBER must be set}"

export DEBFULLNAME="${DEBFULLNAME:-Jitsi Team}"
export DEBEMAIL="${DEBEMAIL:-dev@jitsi.org}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
cd "${THIS_DIR}/.."
OUT_DIR=$(cd .. && pwd)

VERSIONMIN=${BUILD_NUMBER}
VERSION=1.0.${VERSIONMIN}

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    set +u
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use
    nvm install
    nvm use
    set -u
fi

node -v
npm -v

set -x

# The lib-jitsi-meet dependency is a release URL like
# https://github.com/jitsi/lib-jitsi-meet/releases/download/v<n>+<hash>/lib-jitsi-meet.tgz
# (older ones use '-' as separator), extract the commit hash from it.
LJM_DEP=$(node -p "require('./package.json').dependencies['lib-jitsi-meet']")
if [[ "${LJM_DEP}" == *+* ]]; then
    VER_SEPARATOR="+"
else
    VER_SEPARATOR="-"
fi
LIB_JITSI_MEET_COMMIT_HASH=$(echo "${LJM_DEP}" | cut -d '/' -f 8 | cut -d "${VER_SEPARATOR}" -f 2)

rm -rf node_modules
npm install

make source-package

# Cache busting, use the package version for the static assets.
sed -i.bak \
    -e "s/app.bundle.min.js?v=[[:digit:]]*/app.bundle.min.js?v=${VERSIONMIN}/" \
    -e "s/lib-jitsi-meet.min.js?v=[[:digit:]]*/lib-jitsi-meet.min.js?v=${VERSIONMIN}/" \
    -e "s/all.css/all.css?v=${VERSIONMIN}/" \
    -e "s/interface_config.js?v=[[:digit:]]*/interface_config.js?v=${VERSIONMIN}/" \
    index.html
rm -f index.html.bak

REV=$(git log --pretty=format:'%h' -n 1)
dch -v "${VERSION}-1" "Build from git. ${REV}"
dch -D unstable -r ""

dpkg-buildpackage -A -rfakeroot -us -uc

mv jitsi-meet.tar.bz2 "${OUT_DIR}/jitsi-meet-${VERSION}.tar.bz2"

# Restore the files changed for the build.
git checkout debian/changelog index.html
dh clean

cat > "${OUT_DIR}/build_versions.properties" <<EOF
NEW_COMPONENT_NAME=jitsi-meet-web
NEW_COMPONENT_VER=${BUILD_NUMBER}
LIB_JITSI_MEET_VERSION=${LIB_JITSI_MEET_COMMIT_HASH}
EOF

ls -l "${OUT_DIR}"/jitsi-meet*{.deb,.changes,.buildinfo,.tar.bz2}
