import JitsiMeetJS from '../../base/lib-jitsi-meet';

/**
 * Base class for recording backends.
 */
export class RecordingAdapter {

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

    /**
     * Helper method for getting an audio MediaStream. Use this instead of
     * calling browser APIs directly.
     *
     * @protected
     * @param {number} micDeviceId - The ID of the current audio device.
     * @returns {Promise}
     */
    _getAudioStream(micDeviceId) {
        return JitsiMeetJS.createLocalTracks({
            devices: [ 'audio' ],
            micDeviceId
        }).then(result => {
            if (result.length !== 1) {
                throw new Error('Unexpected number of streams '
                    + 'from createLocalTracks.');
            }
            const mediaStream = result[0].stream;

            if (mediaStream === undefined) {
                throw new Error('Failed to get MediaStream.');
            }

            return mediaStream;
        });
    }
}
