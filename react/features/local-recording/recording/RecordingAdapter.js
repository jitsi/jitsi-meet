import JitsiMeetJS from '../../base/lib-jitsi-meet';

/**
 * Base class for recording backends.
 */
export class RecordingAdapter {

    /**
     * Starts recording.
     *
     * @param {string} micDeviceId - The microphone to record on.
     * @returns {Promise}
     */
    start(/* eslint-disable no-unused-vars */
            micDeviceId/* eslint-enable no-unused-vars */) {
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
     * Export the recorded and encoded audio file.
     *
     * @returns {Promise<Object>}
     */
    exportRecordedData() {
        throw new Error('Not implemented');
    }

    /**
     * Mutes or unmutes the current recording.
     *
     * @param {boolean} muted - Whether to mute or to unmute.
     * @returns {Promise}
     */
    setMuted(/* eslint-disable no-unused-vars */
            muted/* eslint-enable no-unused-vars */) {
        throw new Error('Not implemented');
    }

    /**
     * Changes the current microphone.
     *
     * @param {string} micDeviceId - The new microphone device ID.
     * @returns {Promise}
     */
    setMicDevice(/* eslint-disable no-unused-vars */
            micDeviceId/* eslint-enable no-unused-vars */) {
        throw new Error('Not implemented');
    }

    /**
     * Helper method for getting an audio {@code MediaStream}. Use this instead
     * of calling browser APIs directly.
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
                throw new Error('Failed to create local track.');
            }

            return mediaStream;
        });
    }
}
