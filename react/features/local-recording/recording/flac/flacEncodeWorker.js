
import {
    MAIN_THREAD_FINISH,
    MAIN_THREAD_INIT,
    MAIN_THREAD_NEW_DATA_ARRIVED,
    WORKER_BLOB_READY,
    WORKER_LIBFLAC_READY
} from './messageTypes';

/**
 * WebWorker that does FLAC encoding using libflac.js
 */

self.FLAC_SCRIPT_LOCATION = '/libs/';
/* eslint-disable */
importScripts('/libs/libflac4-1.3.2.min.js');
/* eslint-enable */

// There is a number of API calls to libflac.js, which does not conform
// to the camalCase naming convention, but we cannot change it.
// So we disable the ESLint rule `new-cap` in this file.
/* eslint-disable new-cap */

// Flow will complain about the number keys in `FLAC_ERRORS`,
// ESLint will complain about the `declare` statement.
// As the current workaround, add an exception for eslint.
/* eslint-disable flowtype/no-types-missing-file-annotation */
declare var Flac: Object;

const FLAC_ERRORS = {
    // The encoder is in the normal OK state and samples can be processed.
    0: 'FLAC__STREAM_ENCODER_OK',

    // The encoder is in the uninitialized state one of the
    // FLAC__stream_encoder_init_*() functions must be called before samples can
    // be processed.
    1: 'FLAC__STREAM_ENCODER_UNINITIALIZED',

    // An error occurred in the underlying Ogg layer.
    2: 'FLAC__STREAM_ENCODER_OGG_ERROR',

    // An error occurred in the underlying verify stream decoder; check
    // FLAC__stream_encoder_get_verify_decoder_state().
    3: 'FLAC__STREAM_ENCODER_VERIFY_DECODER_ERROR',

    // The verify decoder detected a mismatch between the original audio signal
    // and the decoded audio signal.
    4: 'FLAC__STREAM_ENCODER_VERIFY_MISMATCH_IN_AUDIO_DATA',

    // One of the callbacks returned a fatal error.
    5: 'FLAC__STREAM_ENCODER_CLIENT_ERROR',

    // An I/O error occurred while opening/reading/writing a file. Check errno.
    6: 'FLAC__STREAM_ENCODER_IO_ERROR',

    // An error occurred while writing the stream; usually, the write_callback
    // returned an error.
    7: 'FLAC__STREAM_ENCODER_FRAMING_ERROR',

    // Memory allocation failed.
    8: 'FLAC__STREAM_ENCODER_MEMORY_ALLOCATION_ERROR'
};

/**
 * States of the {@code Encoder}.
 */
const EncoderState = Object.freeze({
    /**
     * Initial state, when libflac.js is not initialized.
     */
    UNINTIALIZED: 'uninitialized',

    /**
     * Actively encoding new audio bits.
     */
    WORKING: 'working',

    /**
     * Encoding has finished and encoded bits are available.
     */
    FINISHED: 'finished'
});

/**
 * Default FLAC compression level.
 */
const FLAC_COMPRESSION_LEVEL = 5;

/**
 * Concat multiple Uint8Arrays into one.
 *
 * @param {Uint8Array[]} arrays - Array of Uint8 arrays.
 * @param {number} totalLength - Total length of all Uint8Arrays.
 * @returns {Uint8Array}
 */
function mergeUint8Arrays(arrays, totalLength) {
    const result = new Uint8Array(totalLength);
    let offset = 0;
    const len = arrays.length;

    for (let i = 0; i < len; i++) {
        const buffer = arrays[i];

        result.set(buffer, offset);
        offset += buffer.length;
    }

    return result;
}

/**
 * Wrapper class around libflac API.
 */
class Encoder {

    /**
     * Flac encoder instance ID. (As per libflac.js API).
     * @private
     */
    _encoderId = 0;

    /**
     * Sample rate.
     * @private
     */
    _sampleRate;

    /**
     * Bit depth (bits per sample).
     * @private
     */
    _bitDepth;

    /**
     * Buffer size.
     * @private
     */
    _bufferSize;

    /**
     * Buffers to store encoded bits temporarily.
     */
    _flacBuffers = [];

    /**
     * Length of encoded FLAC bits.
     */
    _flacLength = 0;

    /**
     * The current state of the {@code Encoder}.
     */
    _state = EncoderState.UNINTIALIZED;

    /**
     * The ready-for-grab downloadable Blob.
     */
    _data = null;


    /**
     * Constructor.
     * Note: Only create instance when Flac.isReady() returns true.
     *
     * @param {number} sampleRate - Sample rate of the raw audio data.
     * @param {number} bitDepth - Bit depth (bit per sample).
     * @param {number} bufferSize - The size of each batch.
     */
    constructor(sampleRate, bitDepth = 16, bufferSize = 4096) {
        if (!Flac.isReady()) {
            throw new Error('libflac is not ready yet!');
        }

        this._sampleRate = sampleRate;
        this._bitDepth = bitDepth;
        this._bufferSize = bufferSize;

        // create the encoder
        this._encoderId = Flac.init_libflac_encoder(
            this._sampleRate,

            // Mono channel
            1,
            this._bitDepth,

            FLAC_COMPRESSION_LEVEL,

            // Pass 0 in becuase of unknown total samples,
            0,

            // checksum, FIXME: double-check whether this is necessary
            true,

            // Auto-determine block size (samples per frame)
            0
        );

        if (this._encoderId === 0) {
            throw new Error('Failed to create libflac encoder.');
        }

        // initialize the encoder
        const initResult = Flac.init_encoder_stream(
            this._encoderId,
            this._onEncodedData.bind(this),
            this._onMetadataAvailable.bind(this)
        );

        if (initResult !== 0) {
            throw new Error('Failed to initalise libflac encoder.');
        }

        this._state = EncoderState.WORKING;
    }

    /**
     * Receive and encode new data.
     *
     * @param {Float32Array} audioData - Raw audio data.
     * @returns {void}
     */
    encode(audioData) {
        if (this._state !== EncoderState.WORKING) {
            throw new Error('Encoder is not ready or has finished.');
        }

        if (!Flac.isReady()) {
            throw new Error('Flac not ready');
        }
        const bufferLength = audioData.length;

        // Convert sample to signed 32-bit integers.
        // According to libflac documentation:
        // each sample in the buffers should be a signed integer,
        // right-justified to the resolution set by
        // FLAC__stream_encoder_set_bits_per_sample().

        // Here we are using 16 bits per sample, the samples should all be in
        // the range [-32768,32767]. This is achieved by multipling Float32
        // numbers with 0x7FFF.

        const bufferI32 = new Int32Array(bufferLength);
        const view = new DataView(bufferI32.buffer);
        const volume = 1;
        let index = 0;

        for (let i = 0; i < bufferLength; i++) {
            view.setInt32(index, audioData[i] * (0x7FFF * volume), true);
            index += 4; // 4 bytes (32-bit)
        }

        // pass it to libflac
        const status = Flac.FLAC__stream_encoder_process_interleaved(
            this._encoderId,
            bufferI32,
            bufferI32.length
        );

        if (status !== 1) {
            // gets error number

            const errorNo
                = Flac.FLAC__stream_encoder_get_state(this._encoderId);

            console.error('Error during encoding', FLAC_ERRORS[errorNo]);
        }
    }

    /**
     * Signals the termination of encoding.
     *
     * @returns {void}
     */
    finish() {
        if (this._state === EncoderState.WORKING) {
            this._state = EncoderState.FINISHED;

            const status = Flac.FLAC__stream_encoder_finish(this._encoderId);

            console.log('Flac encoding finished: ', status);

            // free up resources
            Flac.FLAC__stream_encoder_delete(this._encoderId);

            this._data = this._exportFlacBlob();
        }
    }

    /**
     * Gets the encoded flac file.
     *
     * @returns {Blob} - The encoded flac file.
     */
    getBlob() {
        if (this._state === EncoderState.FINISHED) {
            return this._data;
        }

        return null;
    }

    /**
     * Converts flac buffer to a Blob.
     *
     * @private
     * @returns {void}
     */
    _exportFlacBlob() {
        const samples = mergeUint8Arrays(this._flacBuffers, this._flacLength);

        const blob = new Blob([ samples ], { type: 'audio/flac' });

        return blob;
    }

    /* eslint-disable no-unused-vars */
    /**
     * Callback function for saving encoded Flac data.
     * This is invoked by libflac.
     *
     * @private
     * @param {Uint8Array} buffer - The encoded Flac data.
     * @param {number} bytes - Number of bytes in the data.
     * @returns {void}
     */
    _onEncodedData(buffer, bytes) {
        this._flacBuffers.push(buffer);
        this._flacLength += buffer.byteLength;
    }
    /* eslint-enable no-unused-vars */

    /**
     * Callback function for receiving metadata.
     *
     * @private
     * @returns {void}
     */
    _onMetadataAvailable = () => {
        // reserved for future use
    }
}


let encoder = null;

self.onmessage = function(e) {

    switch (e.data.command) {
    case MAIN_THREAD_INIT:
    {
        const bps = e.data.config.bps;
        const sampleRate = e.data.config.sampleRate;

        if (Flac.isReady()) {
            encoder = new Encoder(sampleRate, bps);
            self.postMessage({
                command: WORKER_LIBFLAC_READY
            });
        } else {
            Flac.onready = function() {
                setTimeout(() => {
                    encoder = new Encoder(sampleRate, bps);
                    self.postMessage({
                        command: WORKER_LIBFLAC_READY
                    });
                }, 0);
            };
        }
        break;
    }

    case MAIN_THREAD_NEW_DATA_ARRIVED:
        if (encoder === null) {
            console.error('flacEncoderWorker received data when the encoder is not ready.');
        } else {
            encoder.encode(e.data.buf);
        }
        break;

    case MAIN_THREAD_FINISH:
        if (encoder !== null) {
            encoder.finish();
            const data = encoder.getBlob();

            self.postMessage(
                {
                    command: WORKER_BLOB_READY,
                    buf: data
                }
            );
            encoder = null;
        }
        break;
    }
};
