#!/bin/bash

# This script is executed from Xcode to start the React packager for Debug
# targets.


if [[ "$CONFIGURATION" = "Debug" ]]; then
  if nc -w 5 -z localhost 8081 ; then
    if ! curl -s "http://localhost:8081/status" | grep -q "packager-status:running" ; then
      echo "Port 8081 already in use, packager is either not running or not running correctly"
      exit 2
    fi
  else
    open -g "$SRCROOT/../../node_modules/react-native/scripts/launchPackager.command" || echo "Can't start packager automatically"
  fi
fi
