/* global APP */

/**
 * Implements logs storage through the CallStats.
 */
export default class JitsiMeetLogStorage {

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>
     */
    constructor() {
        /**
         * Counts each log entry, increases on every batch log entry stored.
         * @type {number}
         */
        this.counter = 1;
    }

    /**
     * @return {boolean} <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     */
    isReady() {
        return Boolean(APP.logCollectorStarted && APP.conference);
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     * @param {string|object[]}logEntries an array containing strings
     * representing log lines or aggregated lines objects.
     */
    storeLogs(logEntries) {

        if (!APP.conference.isCallstatsEnabled()) {
            // Discard the logs if CallStats is not enabled.
            return;
        }

        let logJSON = '{"log' + this.counter + '":"\n';
        for (let i = 0, len = logEntries.length; i < len; i++) {
            let logEntry = logEntries[i];
            if (typeof logEntry === 'object') {
                // Aggregated message
                logJSON += '(' + logEntry.count + ') ' + logEntry.text + '\n';
            } else {
                // Regular message
                logJSON += logEntry + '\n';
            }
        }
        logJSON += '"}';

        this.counter += 1;

        // Try catch was used, because there are many variables
        // on the way that could be uninitialized if the storeLogs
        // attempt would be made very early (which is unlikely)
        try {
            APP.conference.logJSON(logJSON);
        } catch (error) {
            // NOTE console is intentional here
            console.error(
                "Failed to store the logs: ", logJSON, error);
        }
    }
}
