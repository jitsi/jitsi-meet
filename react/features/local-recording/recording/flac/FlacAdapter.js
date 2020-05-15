import logger from '../../logger';
import {
    DEBUG,
    MAIN_THREAD_FINISH,
    MAIN_THREAD_INIT,
    MAIN_THREAD_NEW_DATA_ARRIVED,
    WORKER_BLOB_READY,
    WORKER_LIBFLAC_READY
} from './messageTypes';

import { AbstractAudioContextAdapter } from '../AbstractAudioContextAdapter';

/**
 * Recording adapter that uses libflac.js in the background.
 */
export class FlacAdapter extends AbstractAudioContextAdapter {

    /**
     * Instance of WebWorker (flacEncodeWorker).
     */
    _encoder = null;

    /**
     * Resolve function of the Promise returned by {@code stop()}.
     * This is called after the WebWorker sends back {@code WORKER_BLOB_READY}.
     */
    _stopPromiseResolver = null;

    /**
     * Resolve function of the Promise that initializes the flacEncodeWorker.
     */
    _initWorkerPromiseResolver = null;

    /**
     * Initialization promise.
     */
    _initPromise = null;

    /**
     * Constructor.
     */
    constructor() {
        super();
        this._onAudioProcess = this._onAudioProcess.bind(this);
        this._onWorkerMessage = this._onWorkerMessage.bind(this);
    }

    /**
     * Implements {@link RecordingAdapter#start()}.
     *
     * @inheritdoc
     */
    start(micDeviceId) {
        if (!this._initPromise) {
            this._initPromise = this._initialize(micDeviceId);
        }

        return this._initPromise.then(() => {
            this._connectAudioGraph();
        });
    }

    /**
     * Implements {@link RecordingAdapter#stop()}.
     *
     * @inheritdoc
     */
    stop() {
        if (!this._encoder) {
            logger.error('Attempting to stop but has nothing to stop.');

            return Promise.reject();
        }

        return new Promise(resolve => {
            this._initPromise = null;
            this._disconnectAudioGraph();
            this._stopPromiseResolver = resolve;
            this._encoder.postMessage({
                command: MAIN_THREAD_FINISH
            });
        });
    }

    /**
     * Implements {@link RecordingAdapter#exportRecordedData()}.
     *
     * @inheritdoc
     */
    exportRecordedData() {
        if (this._data !== null) {
            return Promise.resolve({
                data: this._data,
                format: 'flac'
            });
        }

        return Promise.reject('No audio data recorded.');
    }

    /**
     * Implements {@link RecordingAdapter#setMuted()}.
     *
     * @inheritdoc
     */
    setMuted(muted) {
        const shouldEnable = !muted;

        if (!this._stream) {
            return Promise.resolve();
        }

        const track = this._stream.getAudioTracks()[0];

        if (!track) {
            logger.error('Cannot mute/unmute. Track not found!');

            return Promise.resolve();
        }

        if (track.enabled !== shouldEnable) {
            track.enabled = shouldEnable;
            logger.log(muted ? 'Mute' : 'Unmute');
        }

        return Promise.resolve();
    }

    /**
     * Implements {@link RecordingAdapter#setMicDevice()}.
     *
     * @inheritdoc
     */
    setMicDevice(micDeviceId) {
        return this._replaceMic(micDeviceId);
    }

    /**
     * Initialize the adapter.
     *
     * @private
     * @param {string} micDeviceId - The current microphone device ID.
     * @returns {Promise}
     */
    _initialize(micDeviceId) {
        if (this._encoder !== null) {
            return Promise.resolve();
        }

        const promiseInitWorker = new Promise((resolve, reject) => {
            try {
                this._loadWebWorker();
            } catch (e) {
                reject();
            }

            // Save the Promise's resolver to resolve it later.
            // This Promise is only resolved in _onWorkerMessage when we
            // receive WORKER_LIBFLAC_READY from the WebWorker.
            this._initWorkerPromiseResolver = resolve;

            // set up listener for messages from the WebWorker
            this._encoder.onmessage = this._onWorkerMessage;

            this._encoder.postMessage({
                command: MAIN_THREAD_INIT,
                config: {
                    sampleRate: this._sampleRate,
                    bps: 16
                }
            });
        });

        // Arrow function is used here because we want AudioContext to be
        // initialized only **after** promiseInitWorker is resolved.
        return promiseInitWorker
            .then(() =>
                this._initializeAudioContext(
                    micDeviceId,
                    this._onAudioProcess
                ));
    }

    /**
     * Callback function for handling AudioProcessingEvents.
     *
     * @private
     * @param {AudioProcessingEvent} e - The event containing the raw PCM.
     * @returns {void}
     */
    _onAudioProcess(e) {
        // Delegates to the WebWorker to do the encoding.
        // The return of getChannelData() is a Float32Array,
        // each element representing one sample.
        const channelLeft = e.inputBuffer.getChannelData(0);

        this._encoder.postMessage({
            command: MAIN_THREAD_NEW_DATA_ARRIVED,
            buf: channelLeft
        });
    }

    /**
     * Handler for messages from flacEncodeWorker.
     *
     * @private
     * @param {MessageEvent} e - The event sent by the WebWorker.
     * @returns {void}
     */
    _onWorkerMessage(e) {
        switch (e.data.command) {
        case WORKER_BLOB_READY:
            // Received a Blob representing an encoded FLAC file.
            this._data = e.data.buf;
            if (this._stopPromiseResolver !== null) {
                this._stopPromiseResolver();
                this._stopPromiseResolver = null;
                this._encoder.terminate();
                this._encoder = null;
            }
            break;
        case DEBUG:
            logger.log(e.data);
            break;
        case WORKER_LIBFLAC_READY:
            logger.log('libflac is ready.');
            this._initWorkerPromiseResolver();
            break;
        default:
            logger.error(
                `Unknown event
                from encoder (WebWorker): "${e.data.command}"!`);
            break;
        }
    }

    /**
     * Loads the WebWorker.
     *
     * @private
     * @returns {void}
     */
    _loadWebWorker() {
        // FIXME: Workaround for different file names in development/
        // production environments.
        // We cannot import flacEncodeWorker as a webpack module,
        // because it is in a different bundle and should be lazy-loaded
        // only when flac recording is in use.
        try {
            // try load the minified version first
            this._encoder = new Worker('/libs/flacEncodeWorker.min.js', { name: 'FLAC encoder worker' });
        } catch (exception1) {
            // if failed, try unminified version
            try {
                this._encoder = new Worker('/libs/flacEncodeWorker.js', { name: 'FLAC encoder worker' });
            } catch (exception2) {
                throw new Error('Failed to load flacEncodeWorker.');
            }
        }
    }
}
