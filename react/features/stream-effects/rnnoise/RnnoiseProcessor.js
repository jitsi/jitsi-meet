import logger from './logger';

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
 * Represents an adaptor for the rnnoise library compiled to webassembly. The class takes care of webassembly
 * memory management and exposes rnnoise functionality such as PCM audio denoising and VAD (voice activity
 * detection) scores.
 */
export default class RnnoiseProcessor {

    /**
     * WASM interface through which calls to rnnoise are made.
     */
    _wsmInterface: Object;

    /**
     * WASM dynamic memory buffer used as input for rnnoise processing method.
     */
    _wsmPcmInput: ?Object;

    /**
     * WASM dynamic memory buffer used as output for rnnoise processing method.
     */
    _wsmPcmOutput: ?Object;

    /**
     * Rnnoise context object needed to perform the audio processing.
     */
    _context: ?Object;

    /**
     * The Float32Array index representing the start point in the wasm heap of the _wsmPcmInput buffer
     */
    _wsmPcmInputF32Index: number;

    /**
     * State flag, check if the instance was destroyed
     */
    _destroyed: boolean = false;

    /**
     * Rnnoise only takes inputs of 480 PCM float32 samples thus 480*4.
     *
     * @class
     * @param {Object} wsmInterface - The first number.
     */
    constructor(wsmInterface: Object) {
        // Considering that we deal with dynamic allocated memory employ exception safety strong guarantee
        // i.e. in case of exception there are no side effects.
        try {

            this._wsmInterface = wsmInterface;

            // For VAD score purposes only allocate the buffers once and reuse them
            this._wsmPcmInput = this._wsmInterface._malloc(RNNOISE_BUFFER_SIZE);

            this._wsmPcmOutput = this._wsmInterface._malloc(RNNOISE_BUFFER_SIZE);

            // The HEAPF32.set function requires an index relative to a Float32 array view of the wasm memory model
            // which is an array of bytes. This means we have to divide it by the size of a float to get the index
            // relative to a Float32 Array.
            if (this._wsmPcmInput) {
                this._wsmPcmInputF32Index = this._wsmPcmInput / 4;
            }

            this._context = this._wsmInterface._rnnoise_create();

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
        this._wsmInterface.HEAPF32.set(pcmSample, this._wsmPcmInputF32Index);
    }

    /**
     * Convert 32 bit Float PCM samples to 16 bit Float PCM samples and store them in 32 bit Floats.
     *
     * @param {Float32Array} f32Array - Array containing 32 bit PCM samples.
     * @returns {void}
     */
    _convertTo16BitPCM(f32Array: Float32Array) {
        const volume = 1;

        f32Array.forEach((value, index) => {
            f32Array[index] = value * (0x7fff * volume);
        });
    }


    /**
     * Release resources associated with the wasm context. If something goes downhill here
     * i.e. Exception is thrown, there is nothing much we can do.
     *
     * @returns {void}
     */
    _releaseWasmResources() {
        // For VAD score purposes only allocate the buffers once and reuse them
        if (this._wsmPcmInput) {
            this._wsmInterface._free(this._wsmPcmInput);
            this._wsmPcmInput = null;
        }

        if (this._wsmPcmOutput) {
            this._wsmInterface._free(this._wsmPcmOutput);
            this._wsmPcmOutput = null;
        }

        if (this._context) {
            this._wsmInterface._rnnoise_destroy(this._context);
            this._context = null;
        }
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
            logger.warn('RnnoiseProcessor instance is destroyed please create another one!');

            return;
        }

        this._releaseWasmResources();

        this._destroyed = true;
    }

    /**
     * Convert 32 bit Float PCM samples to 16 bit Float PCM samples and store them in 32 bit Floats.
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

        const vadProb = this._wsmInterface._rnnoise_process_frame(this._context, this._wsmPcmOutput, this._wsmPcmInput);

        return vadProb;
    }
}
