// @flow

import { EventEmitter } from "events";
import { getLogger } from 'jitsi-meet-logger';
// import { sample } from "lodash";
import * as tf from '@tensorflow/tfjs';

const logger = getLogger(__filename);

const SAMPLE_RATE: number = 16000;

const NUMBER_OF_SAMPLES_REQUIRED: number = 16000;

export default class AudioFeedbackDetector extends EventEmitter{

    // _audiofeedbackWasmModule: any;
    _model : any;

    constructor(model) {
        super();

        this._model = model;
        // // Notify via event that audiofeedback is ready
        // this._audiofeedbackWasmModule = audiofeedbackWasmModule;
        // logger.info("AudioFeedbackDetector initialized...");

        // this._inputOffset = this._audiofeedbackWasmModule._getInputMemoryOffset() / 4;
        // this._outputOffset = this._audiofeedbackWasmModule._getOutputMemoryOffset() /4;
    }

    _copySamplesToWasm(samples: Float32Array) {
        //for (let i = 0; i < samples.length; ++i) {
            let i = samples.subarray(0, 1);
            // this._audiofeedbackWasmModule.HEAPF32.set(i, this._inputOffset);//[this._inputOffset + i] = samples[i];
        //}
    }

    getSampleRate() {
        return SAMPLE_RATE;
    }

    getNumberOfBufferSamples() {
        return NUMBER_OF_SAMPLES_REQUIRED;
    }

    /**
     * 
     * @param {Float32Array} pcmFrame length of the frame needs to be one second at 16khz
     * 
     * @returns {Float32Array} representing the scores of the current audio frame.
     */
    async getAudioFeedbackScore(pcmFrame: Float32Array) {

        if (pcmFrame.length != NUMBER_OF_SAMPLES_REQUIRED) {
            logger.info("Not enough frames!");
            return [1.0, 0.0, 0.0];
        }

        let samples = pcmFrame.subarray(0, 16000);

        const input = tf.tensor1d(samples).as3D(-1, 16000, 1);
        // const scores = this._model.predict(input);
        const scores = await this._model.executeAsync(input);
        // this._copySamplesToWasm(pcmFrame);

        // this._audiofeedbackWasmModule._runInference();

        // const normalOffset = 0;
        // const echoOffset = 1;
        // const howlOffset = 2;

        // const scores = [this._audiofeedbackWasmModule.HEAPF32[this._outputOffset + normalOffset],
        //                 this._audiofeedbackWasmModule.HEAPF32[this._outputOffset + echoOffset],
        //                 this._audiofeedbackWasmModule.HEAPF32[this._outputOffset + howlOffset]];
        // const scores = [1,0,0];
        const finalScores = scores.dataSync();

        // if (finalScores[0] > 0.70) {
        //     logger.info("NORMAL");
        // } else if (finalScores[1] > 0.70) {
        //     logger.info("ECHO");
        // } else if (finalScores[2] > 0.70) {
        //     logger.info("HOWL");
        // }

        let i = 0;
        let max = 0;
        let score = 0.0;
        // TODO simplify
        for (i=0; i < 3; i+=1) {
            if (finalScores[i] > score) {
                max = i;
                score = finalScores[i];
            }
        }

        if (max == 1) {
            logger.info("ECHO", finalScores[1]);
        }

        if (max == 2) {
            logger.info("HOWL", finalScores[2]);
        }

        // logger.info(scores.dataSync());

        return finalScores;//[1.0, 0.0, 0.0];
    }
}