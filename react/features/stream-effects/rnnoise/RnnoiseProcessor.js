// @flow

/**
 * Constant. Rnnoise default sample size, samples of different size won't work.
 */
export const RNNOISE_SAMPLE_LENGTH: number = 480;

/**
 *  Constant. Rnnoise only takes inputs of 480 PCM float32 samples thus 480*4.
 */
const RNNOISE_BUFFER_SIZE: number = RNNOISE_SAMPLE_LENGTH * 4;

/**
 *  Constant. Rnnoise only takes operates on 44.1Khz float 32 little endian PCM.
 */
const PCM_FREQUENCY: number = 44100;

/**
 * Represents an adaptor for the rnnoise library compiled to webassembly. The class takes care of webassembly
 * memory management and exposes rnnoise functionality such as PCM audio denoising and VAD (voice activity
 * detection) scores.
 */
export default class RnnoiseProcessor {
    /**
     * Rnnoise context object needed to perform the audio processing.
     */
    _context: ?Object;

    /**
     * State flag, check if the instance was destroyed.
     */
    _destroyed: boolean = false;

    /**
     * WASM interface through which calls to rnnoise are made.
     */
    _wasmInterface: Object;

    /**
     * WASM dynamic memory buffer used as input for rnnoise processing method.
     */
    _wasmPcmInput: Object;

    /**
     * The Float32Array index representing the start point in the wasm heap of the _wasmPcmInput buffer.
     */
    _wasmPcmInputF32Index: number;

    /**
     * WASM dynamic memory buffer used as output for rnnoise processing method.
     */
    _wasmPcmOutput: Object;

    /**
     * Constructor.
     *
     * @class
     * @param {Object} wasmInterface - WebAssembly module interface that exposes rnnoise functionality.
     */
    constructor(wasmInterface: Object) {
        // Considering that we deal with dynamic allocated memory employ exception safety strong guarantee
        // i.e. in case of exception there are no side effects.
        try {
            this._wasmInterface = wasmInterface;

            // For VAD score purposes only allocate the buffers once and reuse them
            this._wasmPcmInput = this._wasmInterface._malloc(RNNOISE_BUFFER_SIZE);

            if (!this._wasmPcmInput) {
                throw Error('Failed to create wasm input memory buffer!');
            }

            this._wasmPcmOutput = this._wasmInterface._malloc(RNNOISE_BUFFER_SIZE);

            if (!this._wasmPcmOutput) {
                wasmInterface._free(this._wasmPcmInput);
                throw Error('Failed to create wasm output memory buffer!');
            }

            // The HEAPF32.set function requires an index relative to a Float32 array view of the wasm memory model
            // which is an array of bytes. This means we have to divide it by the size of a float to get the index
            // relative to a Float32 Array.
            this._wasmPcmInputF32Index = this._wasmPcmInput / 4;

            this._context = this._wasmInterface._rnnoise_create();
        } catch (error) {
            // release can be called even if not all the components were initialized.
            this._releaseWasmResources();
            throw error;
        }
    }

    /**
     * Copy the input PCM Audio Sample to the wasm input buffer.
     *
     * @param {Float32Array} pcmSample - Array containing 16 bit format PCM sample stored in 32 Floats .
     * @returns {void}
     */
    _copyPCMSampleToWasmBuffer(pcmSample: Float32Array) {
        this._wasmInterface.HEAPF32.set(pcmSample, this._wasmPcmInputF32Index);
    }

    /**
     * Convert 32 bit Float PCM samples to 16 bit Float PCM samples and store them in 32 bit Floats.
     *
     * @param {Float32Array} f32Array - Array containing 32 bit PCM samples.
     * @returns {void}
     */
    _convertTo16BitPCM(f32Array: Float32Array) {
        for (const [ index, value ] of f32Array.entries()) {
            f32Array[index] = value * 0x7fff;
        }
    }

    /**
     * Release resources associated with the wasm context. If something goes downhill here
     * i.e. Exception is thrown, there is nothing much we can do.
     *
     * @returns {void}
     */
    _releaseWasmResources() {
        // For VAD score purposes only allocate the buffers once and reuse them
        if (this._wasmPcmInput) {
            this._wasmInterface._free(this._wasmPcmInput);
            this._wasmPcmInput = null;
        }

        if (this._wasmPcmOutput) {
            this._wasmInterface._free(this._wasmPcmOutput);
            this._wasmPcmOutput = null;
        }

        if (this._context) {
            this._wasmInterface._rnnoise_destroy(this._context);
            this._context = null;
        }
    }

    /**
     * Rnnoise can only operate on a certain PCM array size.
     *
     * @returns {number} - The PCM sample array size as required by rnnoise.
     */
    getSampleLength() {
        return RNNOISE_SAMPLE_LENGTH;
    }

    /**
     * Rnnoise can only operate on a certain format of PCM sample namely float 32 44.1Kz.
     *
     * @returns {number} - PCM sample frequency as required by rnnoise.
     */
    getRequiredPCMFrequency() {
        return PCM_FREQUENCY;
    }

    /**
     * Release any resources required by the rnnoise context this needs to be called
     * before destroying any context that uses the processor.
     *
     * @returns {void}
     */
    destroy() {
        // Attempting to release a non initialized processor, do nothing.
        if (this._destroyed) {
            return;
        }

        this._releaseWasmResources();

        this._destroyed = true;
    }

    /**
     * Calculate the Voice Activity Detection for a raw Float32 PCM sample Array.
     * The size of the array must be of exactly 480 samples, this constraint comes from the rnnoise library.
     *
     * @param {Float32Array} pcmFrame - Array containing 32 bit PCM samples.
     * @returns {Float} Contains VAD score in the interval 0 - 1 i.e. 0.90 .
     */
    calculateAudioFrameVAD(pcmFrame: Float32Array) {
        if (this._destroyed) {
            throw new Error('RnnoiseProcessor instance is destroyed, please create another one!');
        }

        const pcmFrameLength = pcmFrame.length;

        if (pcmFrameLength !== RNNOISE_SAMPLE_LENGTH) {
            throw new Error(`Rnnoise can only process PCM frames of 480 samples! Input sample was:${pcmFrameLength}`);
        }

        this._convertTo16BitPCM(pcmFrame);
        this._copyPCMSampleToWasmBuffer(pcmFrame);

        return this._wasmInterface._rnnoise_process_frame(this._context, this._wasmPcmOutput, this._wasmPcmInput);
    }
}
