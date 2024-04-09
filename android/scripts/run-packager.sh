#!/bin/bash

# This script is executed bt Gradle to start the React packager for Debug
# targets.

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"
echo "export RCT_METRO_PORT=${RCT_METRO_PORT}" > "${THIS_DIR}/../../node_modules/react-native/scripts/.packager.env"

adb reverse tcp:$RCT_METRO_PORT tcp:$RCT_METRO_PORT

if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then
  if ! curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then
    echo "Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"
    exit 2
  fi
else
    CMD="$THIS_DIR/run-packager-helper.command"
    if [[ `uname` == "Darwin"  ]]; then
        open -g "${CMD}" || echo "Can't start packager automatically"
    else
        xdg-open "${CMD}" || echo "Can't start packager automatically"
    fi
fi
