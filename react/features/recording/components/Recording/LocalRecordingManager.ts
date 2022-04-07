import { v4 as uuidV4 } from 'uuid';

import { getRoomName } from '../../../base/conference';
import { MEDIA_TYPE } from '../../../base/media';
import { getTrackState } from '../../../base/tracks';
// @ts-ignore
import { stopLocalVideoRecording } from '../../actions';

interface IReduxStore {
    dispatch: Function;
    getState: Function;
}

interface ILocalRecordingManager {
    recordingData: Blob[];
    recorder: MediaRecorder|undefined;
    stream: MediaStream|undefined;
    audioContext: AudioContext|undefined;
    audioDestination: MediaStreamAudioDestinationNode|undefined;
    roomName: string;
    mediaType: string;
    initializeAudioMixer: () => void;
    mixAudioStream: (stream: MediaStream) => void;
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    getFilename: () => string;
    saveRecording: (recordingData: Blob[], filename: string) => void;
    stopLocalRecording: () => void;
    startLocalRecording: (store: IReduxStore) => void;
    isRecordingLocally: () => boolean;
    totalSize: number;
}

const LocalRecordingManager: ILocalRecordingManager = {
    recordingData: [],
    recorder: undefined,
    stream: undefined,
    audioContext: undefined,
    audioDestination: undefined,
    roomName: '',
    mediaType: MediaRecorder.isTypeSupported('video/mp4') ? 'mp4' : 'webm',
    totalSize: 1073741824, // 1GB in bytes

    /**
     * Initializes audio context used for mixing audio tracks.
     */
    initializeAudioMixer() {
        this.audioContext = new AudioContext();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
    },

    /**
     * Mixes multiple audio tracks to the destination media stream.
     * */
    mixAudioStream(stream) {
        if (stream.getAudioTracks().length > 0 && this.audioDestination) {
            this.audioContext?.createMediaStreamSource(stream).connect(this.audioDestination);
        }
    },

    /**
     * Adds audio track to the recording stream.
     */
    addAudioTrackToLocalRecording(track) {
        if (track) {
            const stream = new MediaStream([ track ]);

            this.mixAudioStream(stream);
        }
    },

    /**
     * Returns a filename based ono the Jitsi room name in the URL and timestamp.
     * */
    getFilename() {
        const now = new Date();
        const timestamp = now.toISOString();

        return `${this.roomName}_${timestamp}`;
    },

    /**
     * Saves local recording to file.
     * */
    saveRecording(recordingData, filename) {
        // @ts-ignore
        const blob = new Blob(recordingData, { type: `video/${this.mediaType}` });
        // @ts-ignore
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.style.display = 'none';
        a.href = url;
        a.download = `${filename}.${this.mediaType}`;
        a.click();
    },

    /**
     * Stops local recording.
     * */
    stopLocalRecording() {
        if (this.recorder) {
            this.recorder.stop();
            this.recorder = undefined;
            this.audioContext = undefined;
            this.audioDestination = undefined;
            setTimeout(() => this.saveRecording(this.recordingData, this.getFilename()), 1000);
        }
    },

    /**
     * Starts a local recording.
     */
    async startLocalRecording(store) {
        const { dispatch, getState } = store;
        // @ts-ignore
        const supportsCaptureHandle = Boolean(navigator.mediaDevices.setCaptureHandleConfig);
        const tabId = uuidV4();

        if (supportsCaptureHandle) {
            // @ts-ignore
            navigator.mediaDevices.setCaptureHandleConfig({
                handle: `JitsiMeet-${tabId}`,
                permittedOrigins: [ '*' ]
            });
        }

        this.recordingData = [];
        // @ts-ignore
        const gdmStream = await navigator.mediaDevices.getDisplayMedia({
            // @ts-ignore
            video: { displaySurface: 'browser' },
            audio: true
        });
        // @ts-ignore
        const isBrowser = gdmStream.getVideoTracks()[0].getSettings().displaySurface === 'browser';

        if (!isBrowser || (supportsCaptureHandle // @ts-ignore
            && gdmStream.getVideoTracks()[0].getCaptureHandle()?.handle !== `JitsiMeet-${tabId}`)) {
            gdmStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            throw new Error('WrongSurfaceSelected');
        }

        this.initializeAudioMixer();
        this.mixAudioStream(gdmStream);
        this.roomName = getRoomName(getState());
        const tracks = getTrackState(getState());

        tracks.forEach((track: any) => {
            if (track.mediaType === MEDIA_TYPE.AUDIO) {
                const audioTrack = track?.jitsiTrack?.track;

                this.addAudioTrackToLocalRecording(audioTrack);
            }
        });

        this.stream = new MediaStream([
            ...(this.audioDestination?.stream.getAudioTracks() || []),
            gdmStream.getVideoTracks()[0]
        ]);
        this.recorder = new MediaRecorder(this.stream, {
            mimeType: `video/${this.mediaType}`,
            videoBitsPerSecond: 2500000 // 2.5Mbps in bits
        });
        this.recorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
                this.recordingData.push(e.data);
                this.totalSize -= e.data.size;
                if(this.totalSize <= 0) {
                    this.stopLocalRecording();
                }
            }
        };

        this.recorder.addEventListener('stop', () => {
            this.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            gdmStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        });

        gdmStream.addEventListener('inactive', () => {
            dispatch(stopLocalVideoRecording());
        });

        this.stream.addEventListener('inactive', () => {
            dispatch(stopLocalVideoRecording());
        });

        this.recorder.start(5000);
    },

    /**
     * Whether or not we're currently recording locally.
     */
    isRecordingLocally() {
        return Boolean(this.recorder);
    }

};

export default LocalRecordingManager;
