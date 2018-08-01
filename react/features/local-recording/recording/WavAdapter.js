import { RecordingAdapter } from './RecordingAdapter';
import { downloadBlob, timestampString } from './Utils';

const logger = require('jitsi-meet-logger').getLogger(__filename);

const WAV_BITS_PER_SAMPLE = 16;
const WAV_SAMPLE_RATE = 44100;

/**
 * Recording adapter for raw WAVE format.
 */
export class WavAdapter extends RecordingAdapter {

    /**
     * The current {@code MediaStream} instance.
     */
    _stream = null;

    /**
     * {@code AudioContext} instance.
     */
    _audioContext = null;

    /**
     * {@code ScriptProcessorNode} instance, which receives the raw PCM bits.
     */
    _audioProcessingNode = null;

    /**
     * {@code MediaStreamAudioSourceNode} instance, which represents the mic.
     */
    _audioSource = null;

    /**
     * Length of the WAVE file, in number of samples.
     */
    _wavLength = 0;

    /**
     * The {@code ArrayBuffer}s that stores the PCM bits.
     */
    _wavBuffers = [];

    /**
     * Whether or not the {@code WavAdapter} is in a ready state.
     */
    _isInitialized = false;

    /**
     * Initialization promise.
     */
    _initPromise = null;

    /**
     * Constructor.
     */
    constructor() {
        super();

        this._onReceivePCM = this._onReceivePCM.bind(this);
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
            this._wavBuffers = [];
            this._wavLength = 0;

            this._audioSource.connect(this._audioProcessingNode);
            this._audioProcessingNode
                .connect(this._audioContext.destination);
        });
    }

    /**
     * Implements {@link RecordingAdapter#stop()}.
     *
     * @inheritdoc
     */
    stop() {
        this._audioProcessingNode.disconnect();
        this._audioSource.disconnect();
        this._data = this._exportMonoWAV(this._wavBuffers, this._wavLength);
        this._audioContext = null;
        this._audioProcessingNode = null;
        this._audioSource = null;
        this._isInitialized = false;

        return Promise.resolve();
    }

    /**
     * Implements {@link RecordingAdapter#download()}.
     *
     * @inheritdoc
     */
    download() {
        if (this._data !== null) {
            const audioURL = window.URL.createObjectURL(this._data);

            downloadBlob(audioURL, `recording${timestampString()}.wav`);
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
     * Creates a WAVE file header.
     *
     * @private
     * @param {number} dataLength - Length of the payload (PCM data), in bytes.
     * @returns {Uint8Array}
     */
    _createWavHeader(dataLength) {
        // adapted from
        // https://github.com/mmig/speech-to-flac/blob/master/encoder.js

        // ref: http://soundfile.sapp.org/doc/WaveFormat/

        // create our WAVE file header
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');

        // set file size at the end
        writeUTFBytes(view, 8, 'WAVE');

        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);

        // NumChannels
        view.setUint16(22, 1, true);

        // SampleRate
        view.setUint32(24, WAV_SAMPLE_RATE, true);

        // ByteRate
        view.setUint32(28,
            Number(WAV_SAMPLE_RATE) * 1 * WAV_BITS_PER_SAMPLE / 8, true);

        // BlockAlign
        view.setUint16(32, 1 * Number(WAV_BITS_PER_SAMPLE) / 8, true);

        view.setUint16(34, WAV_BITS_PER_SAMPLE, true);

        // data sub-chunk
        writeUTFBytes(view, 36, 'data');

        // file length
        view.setUint32(4, 32 + dataLength, true);

        // data chunk length
        view.setUint32(40, dataLength, true);

        return new Uint8Array(buffer);
    }

    /**
     * Initialize the adapter.
     *
     * @private
     * @param {string} micDeviceId - The current microphone device ID.
     * @returns {Promise}
     */
    _initialize(micDeviceId) {
        if (this._isInitialized) {
            return Promise.resolve();
        }

        const p = new Promise((resolve, reject) => {
            this._getAudioStream(micDeviceId)
            .then(stream => {
                this._stream = stream;
                this._audioContext = new AudioContext({
                    sampleRate: WAV_SAMPLE_RATE
                });
                this._audioSource
                    = this._audioContext.createMediaStreamSource(stream);
                this._audioProcessingNode
                    = this._audioContext.createScriptProcessor(4096, 1, 1);
                this._audioProcessingNode.onaudioprocess = e => {
                    const channelLeft = e.inputBuffer.getChannelData(0);

                    // See: https://developer.mozilla.org/en-US/docs/Web/API/
                    //      AudioBuffer/getChannelData
                    // The returned value is an Float32Array.
                    this._onReceivePCM(channelLeft);
                };
                this._isInitialized = true;
                resolve();
            })
            .catch(err => {
                logger.error(`Error calling getUserMedia(): ${err}`);
                reject();
            });
        });

        return p;
    }

    /**
     * Callback function that saves the PCM bits.
     *
     * @private
     * @param {Float32Array} data - The audio PCM data.
     * @returns {void}
     */
    _onReceivePCM(data) {
        // Need to copy the Float32Array:
        // unlike passing to WebWorker, this data is passed by reference,
        // so we need to copy it, otherwise the resulting audio file will be
        // just repeating the last segment.
        this._wavBuffers.push(new Float32Array(data));
        this._wavLength += data.length;
    }

    /**
     * Combines buffers and export to a wav file.
     *
     * @private
     * @param {Float32Array[]} buffers - The stored buffers.
     * @param {number} length - Total length (number of samples).
     * @returns {Blob}
     */
    _exportMonoWAV(buffers, length) {
        const dataLength = length * 2; // each sample = 16 bit = 2 bytes
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        // copy WAV header data into the array buffer
        const header = this._createWavHeader(dataLength);
        const len = header.length;

        for (let i = 0; i < len; ++i) {
            view.setUint8(i, header[i]);
        }

        // write audio data
        floatTo16BitPCM(view, 44, buffers);

        return new Blob([ view ], { type: 'audio/wav' });
    }
}


/**
 * Helper function. Writes a UTF string to memory
 * using big endianness. Required by WAVE headers.
 *
 * @param {ArrayBuffer} view - The view to memory.
 * @param {*} offset - Offset.
 * @param {*} string - The string to be written.
 * @returns {void}
 */
function writeUTFBytes(view, offset, string) {
    const lng = string.length;

    // convert to big endianness
    for (let i = 0; i < lng; ++i) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Helper function for converting Float32Array to Int16Array.
 *
 * @param {*} output - The output buffer.
 * @param {*} offset - The offset in output buffer to write from.
 * @param {*} inputBuffers - The input buffers.
 * @returns {void}
 */
function floatTo16BitPCM(output, offset, inputBuffers) {

    let i, j;
    let input, s, sampleCount;
    const bufferCount = inputBuffers.length;
    let o = offset;

    for (i = 0; i < bufferCount; ++i) {
        input = inputBuffers[i];
        sampleCount = input.length;
        for (j = 0; j < sampleCount; ++j, o += 2) {
            s = Math.max(-1, Math.min(1, input[j]));
            output.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }
}
