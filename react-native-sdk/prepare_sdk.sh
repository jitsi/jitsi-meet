#!/bin/bash

cp -r ../images .
cp -r ../sounds .
cp -r ../lang .
cp -r ../modules .
cp -r ../react .
cp -r ../service .

cp -r ../ios/sdk/sdk.xcodeproj ./ios
cp -r ../ios/sdk/src/callkit ./ios/src
cp -r ../ios/sdk/src/dropbox ./ios/src
cp -r ../ios/sdk/src/picture-in-picture ./ios/src
cp ../ios/sdk/src/AppInfo.m ./ios/src
cp ../ios/sdk/src/AudioMode.m ./ios/src
cp ../ios/sdk/src/InfoPlistUtil.m ./ios/src
cp ../ios/sdk/src/InfoPlistUtil.h ./ios/src
cp ../ios/sdk/src/JavaScriptSandbox.m ./ios/src
cp ../ios/sdk/src/JitsiAudioSession.m ./ios/src
cp ../ios/sdk/src/JitsiAudioSession.h ./ios/src
cp ../ios/sdk/src/JitsiAudioSession+Private.h ./ios/src
cp ../ios/sdk/src/LocaleDetector.m ./ios/src
cp ../ios/sdk/src/POSIX.m ./ios/src
cp ../ios/sdk/src/Proximity.m ./ios/src











