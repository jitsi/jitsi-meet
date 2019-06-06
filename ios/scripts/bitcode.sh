#!/bin/bash

# This script will download a bitcode build of the WebRTC framework, if needed.

if [[ ! "$CONFIGURATION" = "Debug" ]]; then
    RN_WEBRTC="$SRCROOT/../../node_modules/react-native-webrtc"

    if otool -arch arm64 -l $RN_WEBRTC/ios/WebRTC.framework/WebRTC | grep -q LLVM; then
        echo "WebRTC framework has bitcode"
    else
        echo "WebRTC framework has NO bitcode"
        $RN_WEBRTC/tools/downloadBitcode.sh
    fi
fi

