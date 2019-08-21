import logger from '../logger';
import { AbstractAudioContextAdapter } from './AbstractAudioContextAdapter';

const WAV_BITS_PER_SAMPLE = 16;

/**
 * Recording adapter for raw WAVE format.
 */
export class WavAdapter extends AbstractAudioContextAdapter {

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
        this._onAudioProcess = this._onAudioProcess.bind(this);
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

            this._connectAudioGraph();
        });
    }

    /**
     * Implements {@link RecordingAdapter#stop()}.
     *
     * @inheritdoc
     */
    stop() {
        this._disconnectAudioGraph();
        this._data = this._exportMonoWAV(this._wavBuffers, this._wavLength);
        this._audioProcessingNode = null;
        this._audioSource = null;
        this._isInitialized = false;

        return Promise.resolve();
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
                format: 'wav'
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
        view.setUint32(24, this._sampleRate, true);

        // ByteRate
        view.setUint32(28,
            Number(this._sampleRate) * 1 * WAV_BITS_PER_SAMPLE / 8, true);

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

        return this._initializeAudioContext(micDeviceId, this._onAudioProcess)
            .then(() => {
                this._isInitialized = true;
            });
    }

    /**
     * Callback function for handling AudioProcessingEvents.
     *
     * @private
     * @param {AudioProcessingEvent} e - The event containing the raw PCM.
     * @returns {void}
     */
    _onAudioProcess(e) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/
        //      AudioBuffer/getChannelData
        // The returned value is an Float32Array.
        const channelLeft = e.inputBuffer.getChannelData(0);

        // Need to copy the Float32Array:
        // unlike passing to WebWorker, this data is passed by reference,
        // so we need to copy it, otherwise the resulting audio file will be
        // just repeating the last segment.
        this._wavBuffers.push(new Float32Array(channelLeft));
        this._wavLength += channelLeft.length;
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
 * @param {number} offset - Offset.
 * @param {string} string - The string to be written.
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
 * @param {DataView} output - View to the output buffer.
 * @param {number} offset - The offset in output buffer to write from.
 * @param {Float32Array[]} inputBuffers - The input buffers.
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
