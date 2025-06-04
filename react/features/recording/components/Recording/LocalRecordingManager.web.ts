// @ts-ignore
import * as ebml from 'ts-ebml/dist/EBML.min.js';
import { v4 as uuidV4 } from 'uuid';

import { IStore } from '../../../app/types';
import { getRoomName } from '../../../base/conference/functions';
import { isMobileBrowser } from '../../../base/environment/utils';
import { browser } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getLocalTrack, getTrackState } from '../../../base/tracks/functions';
import { isEmbedded } from '../../../base/util/embedUtils';
import { stopLocalVideoRecording } from '../../actions.any';
import logger from '../../logger';

interface ISelfRecording {
    on: boolean;
    withVideo: boolean;
}

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    audioContext: AudioContext | undefined;
    audioDestination: MediaStreamAudioDestinationNode | undefined;
    fileHandle: FileSystemFileHandle | undefined;
    firstChunk: Blob | undefined;
    getFilename: () => string;
    initializeAudioMixer: () => void;
    isRecordingLocally: () => boolean;
    isSupported: () => boolean;
    mediaType: string;
    mixAudioStream: (stream: MediaStream) => void;
    recorder: MediaRecorder | undefined;
    roomName: string;
    selfRecording: ISelfRecording;
    startLocalRecording: (store: IStore, onlySelf: boolean) => Promise<void>;
    startTime: number | undefined;
    stopLocalRecording: () => void;
    stream: MediaStream | undefined;
    writableStream: FileSystemWritableFileStream | undefined;
}

/**
 * After a lot of trial and error, this is the preferred media type for
 * local recording. It is the only one that works across all platforms, with the
 * only caveat being that the resulting file wouldn't be seekable.
 *
 * We solve that by fixing the first Blob in order to reserve the space for the
 * corrected metadata, and after the recording is done, we do it again, this time with
 * the real duration, and overwrite the first part of the file.
 */
const PREFERRED_MEDIA_TYPE = 'video/webm;codecs=vp8,opus';

const VIDEO_BIT_RATE = 2500000; // 2.5Mbps in bits


const LocalRecordingManager: ILocalRecordingManager = {
    recorder: undefined,
    stream: undefined,
    audioContext: undefined,
    audioDestination: undefined,
    roomName: '',
    selfRecording: {
        on: false,
        withVideo: false
    },
    firstChunk: undefined,
    fileHandle: undefined,
    startTime: undefined,
    writableStream: undefined,

    get mediaType() {
        if (this.selfRecording.on && !this.selfRecording.withVideo) {
            return 'audio/webm;';
        }

        return PREFERRED_MEDIA_TYPE;
    },

    /**
     * Initializes audio context used for mixing audio tracks.
     *
     * @returns {void}
     */
    initializeAudioMixer() {
        this.audioContext = new AudioContext();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
    },

    /**
     * Mixes multiple audio tracks to the destination media stream.
     *
     * @param {MediaStream} stream - The stream to mix.
     * @returns {void}
     * */
    mixAudioStream(stream) {
        if (stream.getAudioTracks().length > 0 && this.audioDestination) {
            this.audioContext?.createMediaStreamSource(stream).connect(this.audioDestination);
        }
    },

    /**
     * Adds audio track to the recording stream.
     *
     * @param {MediaStreamTrack} track - The track to be added.
     * @returns {void}
     */
    addAudioTrackToLocalRecording(track) {
        if (this.selfRecording.on) {
            return;
        }
        if (track) {
            const stream = new MediaStream([ track ]);

            this.mixAudioStream(stream);
        }
    },

    /**
     * Returns a filename based ono the Jitsi room name in the URL and timestamp.
     *
     * @returns {string}
     * */
    getFilename() {
        const now = new Date();
        const timestamp = now.toISOString();

        return `${this.roomName}_${timestamp}`;
    },

    /**
     * Stops local recording.
     *
     * @returns {void}
     * */
    stopLocalRecording() {
        this.recorder?.stop();
    },

    /**
     * Starts a local recording.
     *
     * @param {IStore} store - The redux store.
     * @param {boolean} onlySelf - Whether to record only self streams.
     * @returns {void}
     */
    async startLocalRecording(store, onlySelf) {
        const { dispatch, getState } = store;

        this.roomName = getRoomName(getState()) ?? '';

        // Get a handle to the file we are going to write.
        const options = {
            startIn: 'downloads',
            suggestedName: `${this.getFilename()}.webm`,
        };

        // @ts-expect-error
        this.fileHandle = await window.showSaveFilePicker(options);
        this.writableStream = await this.fileHandle?.createWritable();

        const supportsCaptureHandle = !isEmbedded();
        const tabId = uuidV4();

        this.selfRecording.on = onlySelf;
        let gdmStream: MediaStream = new MediaStream();
        const tracks = getTrackState(getState());

        if (onlySelf) {
            const audioTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;
            let videoTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.VIDEO)?.jitsiTrack?.track;

            if (videoTrack && videoTrack.readyState !== 'live') {
                videoTrack = undefined;
            }

            if (!audioTrack && !videoTrack) {
                throw new Error('NoLocalStreams');
            }

            this.selfRecording.withVideo = Boolean(videoTrack);
            const localTracks: MediaStreamTrack[] = [];

            audioTrack && localTracks.push(audioTrack);
            videoTrack && localTracks.push(videoTrack);
            this.stream = new MediaStream(localTracks);
        } else {
            if (supportsCaptureHandle) {
                // @ts-ignore
                navigator.mediaDevices.setCaptureHandleConfig({
                    handle: `JitsiMeet-${tabId}`,
                    permittedOrigins: [ '*' ]
                });
            }

            gdmStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                    frameRate: 30
                },
                audio: {
                    autoGainControl: false,
                    channelCount: 2,
                    echoCancellation: false,
                    noiseSuppression: false,
                    // @ts-ignore
                    restrictOwnAudio: false,
                    // @ts-ignore
                    suppressLocalAudioPlayback: false,
                },
                // @ts-ignore
                preferCurrentTab: true,
                surfaceSwitching: 'exclude'
            });

            const gdmVideoTrack = gdmStream.getVideoTracks()[0];
            const isBrowser = gdmVideoTrack.getSettings().displaySurface === 'browser';
            const matchesHandle = (supportsCaptureHandle // @ts-ignore
                && gdmVideoTrack.getCaptureHandle()?.handle === `JitsiMeet-${tabId}`);

            if (!isBrowser || !matchesHandle) {
                gdmStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                throw new Error('WrongSurfaceSelected');
            }

            this.initializeAudioMixer();

            const gdmAudioTrack = gdmStream.getAudioTracks()[0];

            if (!gdmAudioTrack) {
                throw new Error('NoAudioTrackFound');
            }

            this.addAudioTrackToLocalRecording(gdmAudioTrack);

            const localAudioTrack = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;

            if (localAudioTrack) {
                this.addAudioTrackToLocalRecording(localAudioTrack);
            }

            this.stream = new MediaStream([
                ...this.audioDestination?.stream.getAudioTracks() || [],
                gdmVideoTrack
            ]);
        }

        this.recorder = new MediaRecorder(this.stream, {
            // @ts-ignore
            audioBitrateMode: 'constant',
            mimeType: this.mediaType,
            videoBitsPerSecond: VIDEO_BIT_RATE
        });

        this.recorder.addEventListener('dataavailable', async e => {
            if (this.recorder && e.data && e.data.size > 0) {
                let data = e.data;

                if (!this.firstChunk) {
                    this.firstChunk = data = await fixDuration(data, 864000000); // Reserve 24h.
                }

                await this.writableStream?.write(data);
            }
        });

        this.recorder.addEventListener('start', () => {
            this.startTime = Date.now();
        });

        this.recorder.addEventListener('stop', async () => {
            const duration = Date.now() - this.startTime!;

            this.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            gdmStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());

            // The stop event is emitted when the recorder is done, and _after_ the last buffered
            // data has been handed over to the dataavailable event.
            this.recorder = undefined;
            this.audioContext = undefined;
            this.audioDestination = undefined;
            this.startTime = undefined;

            if (this.writableStream) {
                try {
                    if (this.firstChunk) {
                        await this.writableStream.seek(0);
                        await this.writableStream.write(await fixDuration(this.firstChunk!, duration));
                    }
                    await this.writableStream.close();
                } catch (e) {
                    logger.error('Error while writing to the local recording file', e);
                } finally {
                    this.firstChunk = undefined;
                    this.fileHandle = undefined;
                    this.writableStream = undefined;
                }
            }
        });

        if (!onlySelf) {
            gdmStream?.addEventListener('inactive', () => {
                dispatch(stopLocalVideoRecording());
            });

            this.stream.addEventListener('inactive', () => {
                dispatch(stopLocalVideoRecording());
            });
        }

        this.recorder.start(5000);
    },

    /**
     * Whether or not local recording is supported.
     *
     * @returns {boolean}
     */
    isSupported() {
        return browser.isChromiumBased()
            && !browser.isElectron()
            && !browser.isReactNative()
            && !isMobileBrowser()

            // @ts-expect-error
            && Boolean(navigator.mediaDevices.setCaptureHandleConfig)
            // @ts-expect-error
            && typeof window.showSaveFilePicker !== 'undefined'
            && MediaRecorder.isTypeSupported(PREFERRED_MEDIA_TYPE);
    },

    /**
     * Whether or not we're currently recording locally.
     *
     * @returns {boolean}
     */
    isRecordingLocally() {
        return Boolean(this.recorder);
    }

};

/**
 * Fixes the duration in the WebM container metadata.
 * Note: cues are omitted.
 *
 * @param {Blob} data - The first Blob of WebM data.
 * @param {number} duration - Actual duration of the video in milliseconds.
 * @returns {Promise<Blob>}
 */
async function fixDuration(data: Blob, duration: number): Promise<Blob> {
    const decoder = new ebml.Decoder();
    const reader = new ebml.Reader();

    reader.logging = false;
    reader.drop_default_duration = false;

    const dataBuf = await data.arrayBuffer();
    const elms = decoder.decode(dataBuf);

    for (const elm of elms) {
        reader.read(elm);
    }
    reader.stop();

    const newMetadataBuf = ebml.tools.makeMetadataSeekable(
        reader.metadatas,
        duration,
        [] // No cues
    );

    const body = new Uint8Array(dataBuf).subarray(reader.metadataSize);

    // @ts-ignore
    return new Blob([ newMetadataBuf, body ], { type: data.type });
}

export default LocalRecordingManager;
