// @ts-expect-error
import { createRNNWasmModuleSync } from '@jitsi/rnnoise-wasm';

import { leastCommonMultiple } from '../../base/util/math';
import RnnoiseProcessor from '../rnnoise/RnnoiseProcessor';

/**
 * Per-channel state used for multi-channel / stereo audio processing.
 */
interface IChannelState {
    /**
     * Circular buffer data used for efficient memory operations.
     */
    circularBuffer: Float32Array;

    /**
     * RnnoiseProcessor instance for this channel.
     */
    denoiseProcessor: RnnoiseProcessor;

    /**
     * Start index on the circular buffer of denoised data not yet sent.
     */
    denoisedBufferIndx: number;

    /**
     * Position at which previous denoise iteration ended on the circular buffer.
     */
    denoisedBufferLength: number;

    /**
     * Current length of all gathered raw audio segments.
     */
    inputBufferLength: number;
}

/**
 * Audio worklet which will denoise targeted audio stream using rnnoise.
 * Supports multi-channel and stereo audio processing by maintaining independent
 * RNNoise processor contexts and dedicated circular buffers per channel.
 */
class NoiseSuppressorWorklet extends AudioWorkletProcessor {
    /**
     * Wasm module interface for creating RnnoiseProcessor instances.
     */
    private _wasmModule: any;

    /**
     * Audio worklets work with a predefined sample rate of 128.
     */
    private _procNodeSampleRate = 128;

    /**
     * PCM Sample size expected by the denoise processor.
     */
    private _denoiseSampleSize: number;

    /**
     * Circular buffer data length used for efficient memory operations.
     */
    private _circularBufferLength: number;

    /**
     * Channel states for multi-channel / stereo audio processing.
     */
    private _channelStates: IChannelState[] = [];

    /**
     * C'tor.
     */
    constructor() {
        super();

        /**
         * The wasm module needs to be compiled to load synchronously as the audio worklet `addModule()`
         * initialization process does not wait for the resolution of promises in the AudioWorkletGlobalScope.
         */
        this._wasmModule = createRNNWasmModuleSync();

        /**
         * Primary channel processor to determine sample size and circular buffer dimensions.
         */
        const primaryProcessor = new RnnoiseProcessor(this._wasmModule);

        /**
         * PCM Sample size expected by the denoise processor.
         */
        this._denoiseSampleSize = primaryProcessor.getSampleLength();

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

        this._channelStates.push({
            circularBuffer: new Float32Array(this._circularBufferLength),
            denoiseProcessor: primaryProcessor,
            denoisedBufferIndx: 0,
            denoisedBufferLength: 0,
            inputBufferLength: 0
        });

        this.port.onmessage = (event: MessageEvent) => {
            if (event.data?.action === 'destroy') {
                this._cleanup();
            }
        };
    }

    /**
     * Retrieves or lazily initializes the channel state for a given channel index.
     *
     * @param {number} channelIdx - Index of the audio channel.
     * @returns {IChannelState} The state containing circular buffer and RNNoise processor for the channel.
     * @private
     */
    private _getChannelState(channelIdx: number): IChannelState {
        while (this._channelStates.length <= channelIdx) {
            const denoiseProcessor = new RnnoiseProcessor(this._wasmModule);
            const circularBuffer = new Float32Array(this._circularBufferLength);

            this._channelStates.push({
                circularBuffer,
                denoiseProcessor,
                denoisedBufferIndx: 0,
                denoisedBufferLength: 0,
                inputBufferLength: 0
            });
        }

        return this._channelStates[channelIdx];
    }

    /**
     * Clean up and destroy all allocated WebAssembly RNNoise processor contexts.
     *
     * @private
     * @returns {void}
     */
    private _cleanup(): void {
        for (const state of this._channelStates) {
            state.denoiseProcessor.destroy();
        }
        this._channelStates = [];
    }

    /**
     * Denoises a single channel using its dedicated circular buffer and RNNoise context.
     *
     * @param {number} channelIdx - Index of the channel being processed.
     * @param {Float32Array} inData - Channel input PCM audio frame (128 samples).
     * @param {Float32Array} [outData] - Channel output buffer to receive denoised audio.
     * @private
     * @returns {void}
     */
    private _processChannel(channelIdx: number, inData: Float32Array, outData?: Float32Array): void {
        const state = this._getChannelState(channelIdx);

        // Append new raw PCM sample.
        state.circularBuffer.set(inData, state.inputBufferLength);
        state.inputBufferLength += inData.length;

        // New raw samples were just added, start denoising frames, denoisedBufferLength gives us
        // the position at which the previous denoise iteration ended, basically it takes into account
        // residue data.
        for (; state.denoisedBufferLength + this._denoiseSampleSize <= state.inputBufferLength;
            state.denoisedBufferLength += this._denoiseSampleSize) {
            // Create view of circular buffer so it can be modified in place, removing the need for
            // extra copies.
            const denoiseFrame = state.circularBuffer.subarray(
                state.denoisedBufferLength,
                state.denoisedBufferLength + this._denoiseSampleSize
            );

            state.denoiseProcessor.processAudioFrame(denoiseFrame, true);
        }

        // Determine how much denoised audio is available, if the start index of denoised samples is smaller
        // then denoisedBufferLength that means a rollover occurred.
        let unsentDenoisedDataLength;

        if (state.denoisedBufferIndx > state.denoisedBufferLength) {
            unsentDenoisedDataLength = this._circularBufferLength - state.denoisedBufferIndx;
        } else {
            unsentDenoisedDataLength = state.denoisedBufferLength - state.denoisedBufferIndx;
        }

        // Only copy denoised data to output when there's enough of it to fit the exact buffer length.
        // e.g. if the buffer size is 1024 samples but we only denoised 960 (this happens on the first iteration)
        // nothing happens, then on the next iteration 1920 samples will be denoised so we send 1024 which leaves
        // 896 for the next iteration and so on.
        if (outData && unsentDenoisedDataLength >= outData.length) {
            const denoisedFrame = state.circularBuffer.subarray(
                state.denoisedBufferIndx,
                state.denoisedBufferIndx + outData.length
            );

            outData.set(denoisedFrame, 0);
            state.denoisedBufferIndx += outData.length;
        }

        // When the end of the circular buffer has been reached, start from the beginning. By the time the index
        // starts over, the data from the beginning is stale (has already been processed) and can be safely
        // overwritten.
        if (state.denoisedBufferIndx === this._circularBufferLength) {
            state.denoisedBufferIndx = 0;
        }

        // Because the circular buffer's length is the lcm of both input size and the processor's sample size,
        // by the time we reach the end with the input index the denoise length index will be there as well.
        if (state.inputBufferLength === this._circularBufferLength) {
            state.inputBufferLength = 0;
            state.denoisedBufferLength = 0;
        }
    }

    /**
     * Worklet interface process method. The inputs parameter contains PCM audio that is then sent to rnnoise.
     * Rnnoise only accepts PCM samples of 480 bytes whereas `process` handles 128 sized samples, we take this into
     * account using a circular buffer.
     *
     * In multi-channel / stereo configurations (e.g. stereo music mode, dual-channel high-fidelity audio),
     * each channel is processed through an independent RNNoise context so the spatial stereo image and channel
     * phase relationships are preserved without downmixing or channel loss.
     *
     * @param {Float32Array[][]} inputs - Array of inputs connected to the node, each of them with their associated
     * array of channels. Each channel is an array of 128 pcm samples.
     * @param {Float32Array[][]} outputs - Array of outputs similar to the inputs parameter structure, expected to be
     * filled during the execution of `process`. By default each channel is zero filled.
     * @returns {boolean} - Boolean value that returns whether or not the processor should remain active. Returning
     * false will terminate it.
     */
    process(inputs: Float32Array[][], outputs: Float32Array[][]) {
        const inputChannels = inputs[0];
        const outputChannels = outputs[0];

        // Exit out early if there is no input data (input node not connected/disconnected)
        // as rest of worklet will crash otherwise.
        if (!inputChannels || inputChannels.length === 0 || !inputChannels[0]) {
            return true;
        }

        if (!outputChannels || outputChannels.length === 0 || !outputChannels[0]) {
            return true;
        }

        const channelsToProcess = Math.min(inputChannels.length, outputChannels.length);

        for (let ch = 0; ch < channelsToProcess; ch++) {
            this._processChannel(ch, inputChannels[ch], outputChannels[ch]);
        }

        // If the input is mono but the output expects stereo (or multi-channel),
        // upmix channel 0 to all remaining output channels to prevent silent channels.
        if (inputChannels.length === 1 && outputChannels.length > 1) {
            for (let ch = 1; ch < outputChannels.length; ch++) {
                outputChannels[ch].set(outputChannels[0]);
            }
        }

        return true;
    }
}

registerProcessor('NoiseSuppressorWorklet', NoiseSuppressorWorklet);
