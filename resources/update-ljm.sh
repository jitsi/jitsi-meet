#!/bin/bash

set -e -u

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
LATEST_LJM_COMMIT=$(git ls-remote https://github.com/jitsi/lib-jitsi-meet.git HEAD | awk '{ print $1 }')

pushd ${THIS_DIR}/..

npm install github:jitsi/lib-jitsi-meet#${LATEST_LJM_COMMIT}
git add package.json package-lock.json
git commit -m "chore(deps) lib-jitsi-meet@latest"

popd

echo "Done! Now push your branch to GH and open a PR!"
