import { RecordingAdapter } from './RecordingAdapter';
import { downloadBlob, timestampString } from './Utils';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * RecordingAdapter implementation that uses MediaRecorder
 * (default browser encoding with Opus codec)
 */
export class OggAdapter extends RecordingAdapter {

    /**
     * Instance of MediaRecorder.
     */
    _mediaRecorder = null;

    /**
     * Implements {@link RecordingAdapter#ensureInitialized()}.
     *
     * @inheritdoc
     */
    ensureInitialized() {
        let p = null;

        if (this._mediaRecorder === null) {
            p = new Promise((resolve, error) => {
                this._getAudioStream(0)
                .then(stream => {
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
        } else {
            p = new Promise(resolve => {
                resolve();
            });
        }

        return p;
    }

    /**
     * Implements {@link RecordingAdapter#start()}.
     *
     * @inheritdoc
     */
    start() {
        return new Promise(resolve => {
            this._mediaRecorder.start();
            resolve();
        });
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
     * Callback for encoded data.
     *
     * @private
     * @param {*} data - Encoded data.
     * @returns {void}
     */
    _saveMediaData(data) {
        this._recordedData = data;
    }
}
