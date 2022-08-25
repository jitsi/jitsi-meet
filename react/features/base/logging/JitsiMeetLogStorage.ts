/* eslint-disable lines-around-comment */
// @ts-ignore
import RTCStats from '../../rtcstats/RTCStats';
// @ts-ignore
import { canSendRtcstatsData } from '../../rtcstats/functions';
// @ts-ignore
import { getCurrentConference } from '../conference';

/**
 * Implements log storage interface from the @jitsi/logger lib. Captured
 * logs are sent to CallStats.
 */
export default class JitsiMeetLogStorage {
    counter: number;
    getState: Function;

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>.
     *
     * @param {Function} getState - The Redux store's {@code getState} method.
     */
    constructor(getState: Function) {
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
     * The JitsiMeetLogStorage is ready when the CallStats are started and
     * before refactoring the code it was after the conference has been joined.
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
     * Checks whether callstats logs storage is enabled.
     *
     * @returns {boolean} <tt>true</tt> when this storage can store logs to
     * callstats, <tt>false</tt> otherwise.
     */
    canStoreLogsCallstats() {
        const { callstatsStoreLogs } = this.getState()['features/base/config'];

        // The behavior prior to adding this configuration parameter, is to send logs to callstats (if callstats is
        // enabled). So, in order to maintain backwards compatibility I set the default of this option to be true, i.e.
        // if the config.callstatsStoreLogs is not set, the JS console logs will be sent to callstats (if callstats is
        // enabled)
        return callstatsStoreLogs || callstatsStoreLogs === undefined;
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
        return config?.analytics?.rtcstatsStoreLogs && canSendRtcstatsData(this.getState());
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     *
     * @param {Array<string|Object>} logEntries - An array containing strings
     * representing log lines or aggregated lines objects.
     * @returns {void}
     */
    storeLogs(logEntries: Array<string|any>) {

        if (this.canStoreLogsCallstats()) {
            this.storeLogsCallstats(logEntries);
        }

        if (this.canStoreLogsRtcstats()) {
            RTCStats.sendLogs(logEntries);
        }
    }

    /**
     * Store the console logs in callstats (if callstats is enabled).
     *
     * @param {Array<string|any>} logEntries - The log entries to send to the rtcstats server.
     * @returns {void}
     */
    storeLogsCallstats(logEntries: Array<string|any>) {
        const conference = getCurrentConference(this.getState());

        if (!conference || !conference.isCallstatsEnabled()) {
            // Discard the logs if CallStats is not enabled.
            return;
        }

        let logMessage = `{"log${this.counter}":"\n`;

        for (let i = 0, len = logEntries.length; i < len; i++) {
            const logEntry = logEntries[i];

            if (logEntry.timestamp) {
                logMessage += `${logEntry.timestamp} `;
            }
            if (logEntry.count > 1) {
                logMessage += `(${logEntry.count}) `;
            }
            logMessage += `${logEntry.text}\n`;
        }
        logMessage += '"}';

        this.counter += 1;

        // Try catch was used, because there are many variables
        // on the way that could be uninitialized if the storeLogs
        // attempt would be made very early (which is unlikely)
        try {
            conference.sendApplicationLog(logMessage);
        } catch (error) {
            // NOTE console is intentional here
            console.error(
                `Failed to store the logs, msg length: ${logMessage.length}`
                    + `error: ${JSON.stringify(error)}`);
        }
    }
}
