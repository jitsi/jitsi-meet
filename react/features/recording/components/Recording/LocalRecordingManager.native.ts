interface IReduxStore {
    dispatch: Function;
    getState: Function;
}

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    stopLocalRecording: () => void;
    startLocalRecording: (store: IReduxStore) => void;
    isRecordingLocally: () => boolean;
}

const LocalRecordingManager: ILocalRecordingManager = {
    /**
     * Adds audio track to the recording stream.
     */
    addAudioTrackToLocalRecording(track) {
    },

    /**
     * Stops local recording.
     * */
    stopLocalRecording() {
    },

    /**
     * Starts a local recording.
     */
    async startLocalRecording(store) {
    },

    /**
     * Whether or not we're currently recording locally.
     */
    isRecordingLocally() {
        return false;
    }

};

export default LocalRecordingManager;
