import { NativeModules } from 'react-native';


global.JITSI_MEET_LITE_SDK = Boolean(NativeModules.AppInfo.isLiteSDK);
