// @ts-expect-error
import { createRNNWasmModuleSync } from '@jitsi/rnnoise-wasm';

import { leastCommonMultiple } from '../../base/util/math';
import RnnoiseProcessor from '../rnnoise/RnnoiseProcessor';


/**
 * Audio worklet which will denoise targeted audio stream using rnnoise.
 */
class NoiseSuppressorWorklet extends AudioWorkletProcessor {
    /**
     * RnnoiseProcessor instance.
     */
    private _denoiseProcessor: RnnoiseProcessor;

    /**
     * Audio worklets work with a predefined sample rate of 128.
     */
    private _procNodeSampleRate = 128;

    /**
     * PCM Sample size expected by the denoise processor.
     */
    private _denoiseSampleSize: number;

    /**
     * Circular buffer data used for efficient memory operations.
     */
    private _circularBufferLength: number;

    private _circularBuffer: Float32Array;

    /**
     * The circular buffer uses a couple of indexes to track data segments. Input data from the stream is
     * copied to the circular buffer as it comes in, one `procNodeSampleRate` sized sample at a time.
     * _inputBufferLength denotes the current length of all gathered raw audio segments.
     */
    private _inputBufferLength = 0;

    /**
     * Denoising is done directly on the circular buffer using subArray views, but because
     * `procNodeSampleRate` and `_denoiseSampleSize` have different sizes, denoised samples lag behind
     * the current gathered raw audio samples so we need a different index, `_denoisedBufferLength`.
     */
    private _denoisedBufferLength = 0;

    /**
     * Once enough data has been denoised (size of procNodeSampleRate) it's sent to the
     * output buffer, `_denoisedBufferIndx` indicates the start index on the circular buffer
     * of denoised data not yet sent.
     */
    private _denoisedBufferIndx = 0;

    /**
     * C'tor.
     */
    constructor() {
        super();

        /**
         * The wasm module needs to be compiled to load synchronously as the audio worklet `addModule()`
         * initialization process does not wait for the resolution of promises in the AudioWorkletGlobalScope.
         */
        this._denoiseProcessor = new RnnoiseProcessor(createRNNWasmModuleSync());

        /**
         * PCM Sample size expected by the denoise processor.
         */
        this._denoiseSampleSize = this._denoiseProcessor.getSampleLength();

        /**
         * In order to avoid unnecessary memory related operations a circular buffer was used.
         * Because the audio worklet input array does not match the sample size required by rnnoise two cases can occur
         * 1. There is not enough data in which case we buffer it.
         * 2. There is enough data but some residue remains after the call to `processAudioFrame`, so its buffered
         * for the next call.
         * A problem arises when the circular buffer reaches the end and a rollover is required, namely
         * the residue could potentially be split between the end of buffer and the beginning and would
         * require some complicated logic to handle. Using the lcm as the size of the buffer will
         * guarantee that by the time the buffer reaches the end the residue will be a multiple of the
         * `procNodeSampleRate` and the residue won't be split.
         */
        this._circularBufferLength = leastCommonMultiple(this._procNodeSampleRate, this._denoiseSampleSize);
        this._circularBuffer = new Float32Array(this._circularBufferLength);
    }

    /**
     * Worklet interface process method. The inputs parameter contains PCM audio that is then sent to rnnoise.
     * Rnnoise only accepts PCM samples of 480 bytes whereas `process` handles 128 sized samples, we take this into
     * account using a circular buffer.
     *
     * @param {Float32Array[]} inputs - Array of inputs connected to the node, each of them with their associated
     * array of channels. Each channel is an array of 128 pcm samples.
     * @param {Float32Array[]} outputs - Array of outputs similar to the inputs parameter structure, expected to be
     * filled during the execution of `process`. By default each channel is zero filled.
     * @returns {boolean} - Boolean value that returns whether or not the processor should remain active. Returning
     * false will terminate it.
     */
    process(inputs: Float32Array[][], outputs: Float32Array[][]) {

        // We expect the incoming track to be mono, if a stereo track is passed only on of its channels will get
        // denoised and sent pack.
        // TODO Technically we can denoise both channel however this might require a new rnnoise context, some more
        // investigation is required.
        const inData = inputs[0][0];
        const outData = outputs[0][0];

        // Exit out early if there is no input data (input node not connected/disconnected)
        // as rest of worklet will crash otherwise
        if (!inData) {
            return true;
        }

        // Append new raw PCM sample.
        this._circularBuffer.set(inData, this._inputBufferLength);
        this._inputBufferLength += inData.length;

        // New raw samples were just added, start denoising frames, _denoisedBufferLength gives us
        // the position at which the previous denoise iteration ended, basically it takes into account
        // residue data.
        for (; this._denoisedBufferLength + this._denoiseSampleSize <= this._inputBufferLength;
            this._denoisedBufferLength += this._denoiseSampleSize) {
            // Create view of circular buffer so it can be modified in place, removing the need for
            // extra copies.

            const denoiseFrame = this._circularBuffer.subarray(
                this._denoisedBufferLength,
                this._denoisedBufferLength + this._denoiseSampleSize
            );

            this._denoiseProcessor.processAudioFrame(denoiseFrame, true);
        }

        // Determine how much denoised audio is available, if the start index of denoised samples is smaller
        // then _denoisedBufferLength that means a rollover occurred.
        let unsentDenoisedDataLength;

        if (this._denoisedBufferIndx > this._denoisedBufferLength) {
            unsentDenoisedDataLength = this._circularBufferLength - this._denoisedBufferIndx;
        } else {
            unsentDenoisedDataLength = this._denoisedBufferLength - this._denoisedBufferIndx;
        }

        // Only copy denoised data to output when there's enough of it to fit the exact buffer length.
        // e.g. if the buffer size is 1024 samples but we only denoised 960 (this happens on the first iteration)
        // nothing happens, then on the next iteration 1920 samples will be denoised so we send 1024 which leaves
        // 896 for the next iteration and so on.
        if (unsentDenoisedDataLength >= outData.length) {
            const denoisedFrame = this._circularBuffer.subarray(
                this._denoisedBufferIndx,
                this._denoisedBufferIndx + outData.length
            );

            outData.set(denoisedFrame, 0);
            this._denoisedBufferIndx += outData.length;
        }

        // When the end of the circular buffer has been reached, start from the beginning. By the time the index
        // starts over, the data from the begging is stale (has already been processed) and can be safely
        // overwritten.
        if (this._denoisedBufferIndx === this._circularBufferLength) {
            this._denoisedBufferIndx = 0;
        }

        // Because the circular buffer's length is the lcm of both input size and the processor's sample size,
        // by the time we reach the end with the input index the denoise length index will be there as well.
        if (this._inputBufferLength === this._circularBufferLength) {
            this._inputBufferLength = 0;
            this._denoisedBufferLength = 0;
        }

        return true;
    }
}

registerProcessor('NoiseSuppressorWorklet', NoiseSuppressorWorklet);
