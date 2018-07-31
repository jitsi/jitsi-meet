import { RecordingAdapter } from '../RecordingAdapter';
import { downloadBlob, timestampString } from '../Utils';
import {
    DEBUG,
    MAIN_THREAD_FINISH,
    MAIN_THREAD_INIT,
    MAIN_THREAD_NEW_DATA_ARRIVED,
    WORKER_BLOB_READY,
    WORKER_LIBFLAC_READY
} from './messageTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Recording adapter that uses libflac.js in the background.
 */
export class FlacAdapter extends RecordingAdapter {

    _encoder = null;
    _audioContext = null;
    _audioProcessingNode = null;
    _audioSource = null;
    _stream = null;

    /**
     * Resolve function of the promise returned by {@code stop()}.
     * This is called after the WebWorker sends back {@code WORKER_BLOB_READY}.
     */
    _stopPromiseResolver = null;

    /**
     * Initialization promise.
     */
    _initPromise = null;

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
            this._audioSource.connect(this._audioProcessingNode);
            this._audioProcessingNode.connect(this._audioContext.destination);
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
            this._audioProcessingNode.onaudioprocess = undefined;
            this._audioProcessingNode.disconnect();
            this._audioSource.disconnect();
            this._stopPromiseResolver = resolve;
            this._encoder.postMessage({
                command: MAIN_THREAD_FINISH
            });
        });
    }

    /**
     * Implements {@link RecordingAdapter#download()}.
     *
     * @inheritdoc
     */
    download() {
        if (this._data !== null) {
            const audioURL = window.URL.createObjectURL(this._data);

            downloadBlob(audioURL, `recording${timestampString()}.flac`);
        }
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
     * Replaces the current microphone MediaStream.
     *
     * @param {*} micDeviceId - New microphone ID.
     * @returns {Promise}
     */
    _replaceMic(micDeviceId) {
        if (this._audioContext && this._audioProcessingNode) {
            return new Promise((resolve, reject) => {
                this._getAudioStream(micDeviceId).then(newStream => {
                    const newSource = this._audioContext
                        .createMediaStreamSource(newStream);

                    this._audioSource.disconnect();
                    newSource.connect(this._audioProcessingNode);
                    this._stream = newStream;
                    this._audioSource = newSource;
                    resolve();
                })
                .catch(() => {
                    reject();
                });
            });
        }

        return Promise.resolve();
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

            // set up listen for messages from the WebWorker
            this._encoder.onmessage = e => {
                if (e.data.command === WORKER_BLOB_READY) {
                    // receiving blob
                    this._data = e.data.buf;
                    if (this._stopPromiseResolver !== null) {
                        this._stopPromiseResolver();
                        this._stopPromiseResolver = null;
                        this._encoder.terminate();
                        this._encoder = null;
                    }
                } else if (e.data.command === DEBUG) {
                    logger.log(e.data);
                } else if (e.data.command === WORKER_LIBFLAC_READY) {
                    logger.log('libflac is ready.');
                    resolve();
                } else {
                    logger.error(
                        `Unknown event
                        from encoder (WebWorker): "${e.data.command}"!`);
                }
            };

            this._encoder.postMessage({
                command: MAIN_THREAD_INIT,
                config: {
                    sampleRate: 44100,
                    bps: 16
                }
            });
        });

        const callbackInitAudioContext = (resolve, reject) => {
            this._getAudioStream(micDeviceId)
            .then(stream => {
                this._stream = stream;
                this._audioContext = new AudioContext();
                this._audioSource
                    = this._audioContext.createMediaStreamSource(stream);
                this._audioProcessingNode
                    = this._audioContext.createScriptProcessor(4096, 1, 1);
                this._audioProcessingNode.onaudioprocess = e => {
                    // delegate to the WebWorker to do the encoding
                    const channelLeft = e.inputBuffer.getChannelData(0);

                    this._encoder.postMessage({
                        command: MAIN_THREAD_NEW_DATA_ARRIVED,
                        buf: channelLeft
                    });
                };
                logger.debug('AudioContext is set up.');
                resolve();
            })
            .catch(err => {
                logger.error(`Error calling getUserMedia(): ${err}`);
                reject();
            });
        };

        // Because Promise constructor immediately executes the executor
        // function. This is undesirable, we want callbackInitAudioContext to be
        // executed only **after** promiseInitWorker is resolved.
        return promiseInitWorker
            .then(() => new Promise(callbackInitAudioContext));
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
            this._encoder = new Worker('/libs/flacEncodeWorker.min.js');
        } catch (exception1) {
            // if failed, try unminified version
            try {
                this._encoder = new Worker('/libs/flacEncodeWorker.js');
            } catch (exception2) {
                throw new Error('Failed to load flacEncodeWorker.');
            }
        }
    }
}
