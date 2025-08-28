#!/bin/bash

# This script is executed from Xcode to start the React packager for Debug
# targets.

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"
echo "export RCT_METRO_PORT=${RCT_METRO_PORT}" > "${SRCROOT}/../../node_modules/react-native/scripts/.packager.env"

if [[ "$CONFIGURATION" = "Debug" ]]; then
  if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then
    if ! curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then
      echo "Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"
      exit 2
    fi
  else
    open -g "$THIS_DIR/run-packager-helper.command" || echo "Can't start packager automatically"
  fi
fi
