#!/bin/bash

# This script gets executed from Xcode to disable ATS (App Transport Security)
# on Debug builds. Doing this allows loading resources over HTTP, such as the
# JS bundle.


set -x

case "$CONFIGURATION" in
  Debug)
    # Speed up build times by skipping the creation of the offline package for debug
    # builds on the simulator since the packager is supposed to be running anyways.
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      echo "Skipping bundling for Simulator platform"
      exit 0;
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

if [[ "$CONFIGURATION" = "Debug" && ! "$PLATFORM_NAME" == *simulator ]]; then
  PLISTBUDDY='/usr/libexec/PlistBuddy'
  PLIST=$TARGET_BUILD_DIR/$INFOPLIST_PATH
  `$PLISTBUDDY -c "Add NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" "$PLIST"` || true
fi
