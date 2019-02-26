/**
 * Implements in memory logs storage, used for testing/debugging.
 *
 */
export default class JitsiMeetInMemoryLogStorage {

    /**
     * Creates new <tt>JitsiMeetInMemoryLogStorage</tt>.
     */
    constructor() {
        /**
         * Array of the log entries to keep.
         * @type {array}
         */
        this.logs = [];
    }

    /**
     * Checks if this storage instance is ready.
     *
     * @returns {boolean} <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     */
    isReady() {
        return true;
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     *
     * @param {string|Object[]} logEntries - An array containing strings
     * representing log lines or aggregated lines objects.
     * @returns {void}
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
     * Returns the logs stored in the memory.
     *
     * @returns {Array<string>} The collected log entries.
     */
    getLogs() {
        return this.logs;
    }
}
