/**
 * Common interface for recording mechanisms
 */
export class RecordingAdapter {

    /**
     * Initialize the recording backend.
     *
     * @returns {Promise}
     */
    ensureInitialized() {
        throw new Error('Not implemented');
    }

    /**
     * Starts recording.
     *
     * @returns {Promise}
     */
    start() {
        throw new Error('Not implemented');
    }

    /**
     * Stops recording.
     *
     * @returns {Promise}
     */
    stop() {
        throw new Error('Not implemented');
    }

    /**
     * Initiates download of the recorded and encoded audio file.
     *
     * @returns {void}
     */
    download() {
        throw new Error('Not implemented');
    }
}
