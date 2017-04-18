/* @flow */

/**
 * Implements logs storage through the CallStats.
 */
export default class JitsiMeetLogStorage {

    /**
     * Current conference object.
     *
     * @type {Object}
     */
    conference: Object;

    /**
     * Counts each log entry, increases on every batch log entry stored.
     *
     * @type {number}
     */
    counter: number;

    /**
     * Flag that indicates whether log collector is started.
     *
     * @type {boolen}
     */
    logCollectorStarted: boolean;

    /**
     * Creates new <tt>JitsiMeetLogStorage</tt>.
     *
     * @param {boolean} logCollectorStarted - Flag that indicates whether log
     * collector is started.
     * @param {Object} conference - Current conference object.
     */
    constructor(logCollectorStarted: boolean, conference: Object) {
        this.conference = conference;
        this.counter = 1;
        this.logCollectorStarted = logCollectorStarted;
    }

    /**
     * Method returning <tt>true</tt> when this storage is ready or
     * <tt>false</tt> otherwise.
     *
     * @returns {boolean}
     */
    isReady() {
        return this.logCollectorStarted && this.conference;
    }

    /**
     * Called by the <tt>LogCollector</tt> to store a series of log lines into
     * batch.
     *
     * @param {string|Object[]} logEntries - An array containing strings
     * representing log lines or aggregated lines objects.
     * @returns {void}
     */
    storeLogs(logEntries: Array<string | Object>) {

        if (!this.conference.isCallstatsEnabled()) {
            // Discard the logs if CallStats is not enabled.
            return;
        }

        const logJSON = {};

        logJSON[`log${this.counter}`] = logEntries.reduce((acc, logEntry) => {
            let logValue = '';

            if (typeof logEntry === 'object') {
                // Aggregated message
                logValue += `(${logEntry.count}) ${logEntry.text}`;
            } else {
                // Regular message
                logValue += logEntry;
            }

            logValue += '\n';

            return acc + logValue;
        }, '\n');
        const stringifiedLogJSON = JSON.stringify(logJSON);

        this.counter += 1;

        // Try catch was used, because there are many variables
        // on the way that could be uninitialized if the storeLogs
        // attempt would be made very early (which is unlikely)
        try {
            this.conference.logJSON(stringifiedLogJSON);
        } catch (error) {
            // NOTE console is intentional here
            console.error(
                'Failed to store the logs: ', stringifiedLogJSON, error);
        }
    }
}
