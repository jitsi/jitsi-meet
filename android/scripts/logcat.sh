#!/bin/bash

PKG_NAME=${1:-org.jitsi.meet}
APP_PID=$(adb shell ps | grep $PKG_NAME | awk '{print $2}')

if [[ -z "$APP_PID" ]]; then
    echo "App is not running"
    exit 1
fi

exec adb logcat --pid=$APP_PID
