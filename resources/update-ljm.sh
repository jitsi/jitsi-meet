#!/bin/bash

set -e -u

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
PID=$$
LJM_TMP="${TMPDIR:-/tmp}/ljm-${PID}"

pushd ${THIS_DIR}/..
CURRENT_LJM_COMMIT=$(jq -r '.dependencies."lib-jitsi-meet"' package.json | cut -d "#" -f2)
popd

git clone --branch master --single-branch --bare https://github.com/jitsi/lib-jitsi-meet ${LJM_TMP}

pushd ${LJM_TMP}
LATEST_LJM_COMMIT=$(git rev-parse HEAD)
LJM_COMMITS=$(git log --oneline --no-decorate --no-merges ${CURRENT_LJM_COMMIT}..HEAD --pretty=format:"%x2a%x20%s")
popd

if [[ "${CURRENT_LJM_COMMIT}" == "${LATEST_LJM_COMMIT}" ]]; then
    echo "No need to update, already on the latest commit!"
    rm -rf ${LJM_TMP}
    exit 1
fi

GH_LINK="https://github.com/jitsi/lib-jitsi-meet/compare/${CURRENT_LJM_COMMIT}...${LATEST_LJM_COMMIT}"

pushd ${THIS_DIR}/..
npm install github:jitsi/lib-jitsi-meet#${LATEST_LJM_COMMIT}
git add package.json package-lock.json
git commit -m "chore(deps) lib-jitsi-meet@latest" -m "${LJM_COMMITS}" -m "${GH_LINK}"
popd

rm -rf ${LJM_TMP}

echo "Done! Now push your branch to GH and open a PR!"
