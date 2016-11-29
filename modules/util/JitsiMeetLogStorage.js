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
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     * @param {string|object[]}logEntries an array containing strings
     * representing log lines or aggregated lines objects.
     */
    storeLogs(logEntries) {

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
            // Currently it makes sense to store the log only
            // if CallStats is enabled
            if (APP.logCollectorStarted
                    && APP.conference
                    && APP.conference.isCallstatsEnabled()) {
                APP.conference.logJSON(logJSON);
            }
        } catch (error) {
            // NOTE console is intentional here
            console.error(
                "Failed to store the logs: ", logJSON, error);
        }
    }
}
