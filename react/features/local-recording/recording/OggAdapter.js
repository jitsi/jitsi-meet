import { RecordingAdapter } from './RecordingAdapter';
import { downloadBlob, timestampString } from './Utils';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Recording adapter that uses {@code MediaRecorder} (default browser encoding
 * with Opus codec).
 */
export class OggAdapter extends RecordingAdapter {

    /**
     * Instance of MediaRecorder.
     */
    _mediaRecorder = null;

    /**
     * Initialization promise.
     */
    _initPromise = null;

    /**
     * Implements {@link RecordingAdapter#start()}.
     *
     * @inheritdoc
     */
    start() {
        if (!this._initPromise) {
            this._initPromise = this._initialize();
        }

        return this._initPromise.then(() =>
            new Promise(resolve => {
                this._mediaRecorder.start();
                resolve();
            })
        );
    }

    /**
     * Implements {@link RecordingAdapter#stop()}.
     *
     * @inheritdoc
     */
    stop() {
        return new Promise(
            resolve => {
                this._mediaRecorder.onstop = () => resolve();
                this._mediaRecorder.stop();
            }
        );
    }

    /**
     * Implements {@link RecordingAdapter#download()}.
     *
     * @inheritdoc
     */
    download() {
        if (this._recordedData !== null) {
            const audioURL = window.URL.createObjectURL(this._recordedData);

            downloadBlob(audioURL, `recording${timestampString()}.ogg`);
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
     * Initialize the adapter.
     *
     * @private
     * @returns {Promise}
     */
    _initialize() {
        if (this._mediaRecorder) {
            return Promise.resolve();
        }

        return new Promise((resolve, error) => {
            this._getAudioStream(0)
            .then(stream => {
                this._stream = stream;
                this._mediaRecorder = new MediaRecorder(stream);
                this._mediaRecorder.ondataavailable
                    = e => this._saveMediaData(e.data);
                resolve();
            })
            .catch(err => {
                logger.error(`Error calling getUserMedia(): ${err}`);
                error();
            });
        });
    }

    /**
     * Callback for storing the encoded data.
     *
     * @private
     * @param {Blob} data - Encoded data.
     * @returns {void}
     */
    _saveMediaData(data) {
        this._recordedData = data;
    }
}
