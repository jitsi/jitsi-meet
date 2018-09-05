/**
 * Implements in memory logs storage, used for testing/debugging.
 *
 * FIXME: move to base/logging
 */
export default class JitsiMeetInMemoryLogStorage {

    /**
     * Creates new <tt>JitsiMeetInMemoryLogStorage</tt>
     */
    constructor() {
        /**
         * Array of the log entries to keep.
         * @type {array}
         */
        this.logs = [];
    }

    /**
     * @returns {boolean} <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     */
    isReady() {
        return true;
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     * @param {string|object[]} logEntries an array containing strings
     * representing log lines or aggregated lines objects.
     */
    storeLogs(logEntries) {
        for (let i = 0, len = logEntries.length; i < len; i++) {
            const logEntry = logEntries[i];

            if (typeof logEntry === 'object') {
                this.logs.push(logEntry.text);
            } else {
                // Regular message
                this.logs.push(logEntry);
            }
        }
    }

    /**
     * @returns {array} the collected log entries.
     */
    getLogs() {
        return this.logs;
    }
}
