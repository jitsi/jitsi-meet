import { NativeModules } from 'react-native';

import { getJitsiMeetGlobalNS } from '../../util';

/**
 * If WiFiStats native module exist attach it to JitsiMeetGlobalNS.
 */
if (NativeModules.WiFiStats) {
    getJitsiMeetGlobalNS().getWiFiStats = NativeModules.WiFiStats.getWiFiStats;
}
