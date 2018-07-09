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

    _stopPromiseResolver = null;

    /**
     * Implements {@link RecordingAdapter#ensureInitialized}.
     *
     * @inheritdoc
     */
    ensureInitialized() {
        if (this._encoder !== null) {
            return Promise.resolve();
        }

        const promiseInitWorker = new Promise((resolve, reject) => {
            // FIXME: workaround for different file names in development/
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
                    logger.error('Failed to load flacEncodeWorker.');
                    reject();
                }
            }

            // set up listen for messages from the WebWorker
            this._encoder.onmessage = e => {
                if (e.data.command === WORKER_BLOB_READY) {
                    // receiving blob
                    this._data = e.data.buf;
                    if (this._stopPromiseResolver !== null) {
                        this._stopPromiseResolver();
                        this._stopPromiseResolver = null;
                    }
                } else if (e.data.command === DEBUG) {
                    logger.log(e.data);
                } else if (e.data.command === WORKER_LIBFLAC_READY) {
                    logger.debug('libflac is ready.');
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
            this._getAudioStream(0)
            .then(stream => {
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

        // FIXME: because Promise constructor immediately executes the executor
        // function. This is undesirable, we want callbackInitAudioContext to be
        // executed only **after** promiseInitWorker is resolved.
        return promiseInitWorker
            .then(() => new Promise(callbackInitAudioContext));
    }

    /**
     * Implements {@link RecordingAdapter#start()}.
     *
     * @inheritdoc
     */
    start() {
        this._audioSource.connect(this._audioProcessingNode);
        this._audioProcessingNode.connect(this._audioContext.destination);
    }

    /**
     * Implements {@link RecordingAdapter#stop()}.
     *
     * @inheritdoc
     */
    stop() {
        return new Promise(resolve => {
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
}
