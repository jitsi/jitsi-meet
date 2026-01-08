import { IStore } from '../../app/types';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import RTCStats from '../../rtcstats/RTCStats';
import { isRTCStatsEnabled } from '../../rtcstats/functions';

/**
 * Implements log storage interface from the @jitsi/logger lib, as it stands
 * now it only sends logs to the rtcstats server in case it is enabled.
 */
export default class JitsiMeetLogStorage {
    getState: IStore['getState'];

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>.
     *
     * @param {Function} getState - The Redux store's {@code getState} method.
     */
    constructor(getState: IStore['getState']) {

        /**
         * The Redux store's {@code getState} method.
         *
         * @type {Function}
         */
        this.getState = getState;
    }

    /**
     * The JitsiMeetLogStorage is ready we can use the rtcstats trace to send logs
     * to the rtcstats server.
     *
     * @returns {boolean} <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     */
    isReady() {
        return JitsiMeetJS.rtcstats.isTraceAvailable();
    }

    /**
     * Checks whether rtcstats logs storage is enabled.
     *
     * @returns {boolean} <tt>true</tt> when this storage can store logs to
     * rtcstats, <tt>false</tt> otherwise.
     */
    canStoreLogsRtcstats() {

        const config = this.getState()['features/base/config'];

        // RTCStats can run without sending app logs to the server.
        // Be mindful that there exists another LogStorage instance withing lib-jitsi-meet,
        // that is used to send logs generated there.
        return config?.analytics?.rtcstatsStoreLogs && isRTCStatsEnabled(this.getState());
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     *
     * @param {Array<string|Object>} logEntries - An array containing strings
     * representing log lines or aggregated lines objects.
     * @returns {void}
     */
    storeLogs(logEntries: Array<string | any>) {

        if (this.canStoreLogsRtcstats()) {
            RTCStats.sendLogs(logEntries);
        }
    }
}
