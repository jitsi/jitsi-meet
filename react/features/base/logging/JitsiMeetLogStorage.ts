import { IStore } from '../../app/types';
import RTCStats from '../../rtcstats/RTCStats';
import { isRTCStatsEnabled } from '../../rtcstats/functions';

/**
 * Implements log storage interface from the @jitsi/logger lib.
 */
export default class JitsiMeetLogStorage {
    counter: number;
    getState: IStore['getState'];

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>.
     *
     * @param {Function} getState - The Redux store's {@code getState} method.
     */
    constructor(getState: IStore['getState']) {
        /**
         * Counts each log entry, increases on every batch log entry stored.
         *
         * @type {number}
         */
        this.counter = 1;

        /**
         * The Redux store's {@code getState} method.
         *
         * @type {Function}
         */
        this.getState = getState;
    }

    /**
     * The JitsiMeetLogStorage is ready when the conference has been joined.
     * A conference is considered joined when the 'conference' field is defined
     * in the base/conference state.
     *
     * @returns {boolean} <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     */
    isReady() {
        const { conference } = this.getState()['features/base/conference'];

        return Boolean(conference);
    }

    /**
     * Checks whether rtcstats logs storage is enabled.
     *
     * @returns {boolean} <tt>true</tt> when this storage can store logs to
     * rtcstats, <tt>false</tt> otherwise.
     */
    canStoreLogsRtcstats() {

        const config = this.getState()['features/base/config'];

        // Saving the logs in RTCStats is a new feature and so there is no prior behavior that needs to be maintained.
        // That said, this is still experimental and needs to be rolled out gradually so we want this to be off by
        // default.
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
