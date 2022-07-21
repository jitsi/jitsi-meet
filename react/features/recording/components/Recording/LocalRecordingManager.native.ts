import { IStore } from '../../../app/types';

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    isRecordingLocally: () => boolean;
    startLocalRecording: (store: IStore) => void;
    stopLocalRecording: () => void;
}

const LocalRecordingManager: ILocalRecordingManager = {
    /**
     * Adds audio track to the recording stream.
     *
     * @param {MediaStreamTrack} track - Track to be added,.
     * @returns {void}
     */
    addAudioTrackToLocalRecording() { },

    /**
     * Stops local recording.
     *
     * @returns {void}
     * */
    stopLocalRecording() { },

    /**
     * Starts a local recording.
     *
     * @param {IStore} store - The Redux store.
     * @returns {void}
     */
    async startLocalRecording() { },

    /**
     * Whether or not we're currently recording locally.
     *
     * @returns {boolean}
     */
    isRecordingLocally() {
        return false;
    }

};

export default LocalRecordingManager;
