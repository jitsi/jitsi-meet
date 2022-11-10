import { IStore } from '../../../app/types';

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: any) => void;
    isRecordingLocally: () => boolean;
    selfRecording: {
        on: boolean;
        withVideo: boolean;
    };
    startLocalRecording: (store: IStore, onlySelf: boolean) => void;
    stopLocalRecording: () => void;
}

const LocalRecordingManager: ILocalRecordingManager = {
    selfRecording: {
        on: false,
        withVideo: false
    },

    /**
     * Adds audio track to the recording stream.
     *
     * @param {any} track - Track to be added,.
     * @returns {void}
     */
    addAudioTrackToLocalRecording() { }, // eslint-disable-line @typescript-eslint/no-empty-function

    /**
     * Stops local recording.
     *
     * @returns {void}
     * */
    stopLocalRecording() { }, // eslint-disable-line @typescript-eslint/no-empty-function

    /**
     * Starts a local recording.
     *
     * @param {IStore} store - The Redux store.
     * @returns {void}
     */
    async startLocalRecording() { }, // eslint-disable-line @typescript-eslint/no-empty-function

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
