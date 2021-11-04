
import { getCurrentConference } from '../conference';

/**
 * Implements log storage interface from the jitsi-meet-logger lib. Captured
 * logs are sent to CallStats.
 */
export default class JitsiMeetLogStorage {

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>.
     *
     * @param {Function} getState - The Redux store's {@code getState} method.
     */
    constructor(getState) {
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
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     *
     * @param {Array<string|Object>} logEntries - An array containing strings
     * representing log lines or aggregated lines objects.
     * @returns {void}
     */
    storeLogs(logEntries) {
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
