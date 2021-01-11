#!/bin/bash

set -e -u

if [[ ! -z $(git status -s --untracked-files=no) ]]; then
    echo "Git tree is not clean, aborting!"
    exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo "Not on master, aborting!";
  exit 1;
fi

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
EPOCH=$(date +%s)
NEW_BRANCH="update-ljm-${EPOCH}"
git checkout -b ${NEW_BRANCH}
npm install github:jitsi/lib-jitsi-meet#${LATEST_LJM_COMMIT}
git add package.json package-lock.json
git commit -m "chore(deps) lib-jitsi-meet@latest" -m "${LJM_COMMITS}" -m "${GH_LINK}"
git push origin ${NEW_BRANCH}
gh pr create --repo jitsi/jitsi-meet --fill
popd

rm -rf ${LJM_TMP}
