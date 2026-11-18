#!/bin/bash

# Runs the tests from tests/ against a selenium grid, first with Chrome then with Firefox.
# Logs and test results end up in ./results.
#
# Usage: GRID_HOST_URL=<grid hub url> resources/jenkins/run-grid-tests.sh
#
# Optional environment:
#   BASE_URL              the deployment to test, see tests/env.example
#   MAX_INSTANCES         parallel test instances, default 4
#   REMOTE_RESOURCE_PATH  the path of the test resources on the grid nodes
#   BROWSER_CHROME_BETA, BROWSER_FF_BETA  run the beta browsers
#   EXPECTATIONS          file with the expectations of the deployment, see tests/helpers/expectations.ts
#   DIAL_IN_REST_URL      enables the dial-in tests

set -e -u

: "${GRID_HOST_URL:?GRID_HOST_URL must be set}"

export HEADLESS=true
export MAX_INSTANCES=${MAX_INSTANCES:-4}
export REMOTE_RESOURCE_PATH=${REMOTE_RESOURCE_PATH:-/usr/share/jitsi-meet-torture/resources}

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
cd "${THIS_DIR}/../.."

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    set +u
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use
    nvm install
    nvm use
    set -u
fi

node -v
npm -v

TEST_LOG_DIR=$(pwd)/results
rm -rf "${TEST_LOG_DIR}"
mkdir "${TEST_LOG_DIR}"

cd tests
npm install

rm -rf test-results
mkdir test-results

echo "Starting chrome tests"
if ! npm run test-grid > "${TEST_LOG_DIR}/chrome-chrome.txt" 2>&1; then
    echo "Chrome-chrome tests failed."
    mv test-results "${TEST_LOG_DIR}/test-result-chrome-chrome"
    exit 1
fi
mv test-results "${TEST_LOG_DIR}/test-result-chrome-chrome"

mkdir test-results
echo "Starting FF tests"
if ! npm run test-grid-ff > "${TEST_LOG_DIR}/ff-chrome.txt" 2>&1; then
    echo "Firefox-chrome tests failed."
    mv test-results "${TEST_LOG_DIR}/test-result-ff-chrome"
    exit 1
fi
mv test-results "${TEST_LOG_DIR}/test-result-ff-chrome"
