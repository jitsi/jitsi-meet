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

pushd ${THIS_DIR}/..
CURRENT_LJM_DEP=$(jq -r '.dependencies."lib-jitsi-meet"' package.json)
popd

NEW_LJM_RELEASE=$(gh release list --limit 1 --repo jitsi/lib-jitsi-meet | awk {'print $1'})
GH_LINK="https://github.com/jitsi/lib-jitsi-meet/releases/tag/${NEW_LJM_RELEASE}"
LATEST_LJM_DEP="https://github.com/jitsi/lib-jitsi-meet/releases/download/${NEW_LJM_RELEASE}/lib-jitsi-meet.tgz"

if [[ "${CURRENT_LJM_DEP}" == "${LATEST_LJM_DEP}" ]]; then
    echo "No need to update, already on the latest commit!"
    exit 1
fi

if [[ ${CURRENT_LJM_DEP} =~ ^.*download/(.*)/lib-jitsi-meet\.tgz$ ]]; then
  COMMIT_MSG="https://github.com/jitsi/lib-jitsi-meet/compare/${BASH_REMATCH[1]}...${NEW_LJM_RELEASE}"
else
  COMMIT_MSG=${GH_LINK}
fi

pushd ${THIS_DIR}/..
EPOCH=$(date +%s)
NEW_BRANCH="update-ljm-${EPOCH}"
git checkout -b ${NEW_BRANCH}
npm install ${LATEST_LJM_DEP}
git add package.json package-lock.json
git commit -m "chore(deps) lib-jitsi-meet@latest" -m "${COMMIT_MSG}"
git push origin ${NEW_BRANCH}
gh pr create --repo jitsi/jitsi-meet --fill
popd
