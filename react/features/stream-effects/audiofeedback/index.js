// @flow
// import createAudioFeedbackModule from 'audiofeedback-prevention';
import AudioFeedbackDetector from './AudioFeedbackDetector';
import * as tf from '@tensorflow/tfjs';
import { getLogger } from 'jitsi-meet-logger';
// let audiofeedbackTFLiteModel = '/libs/audiofeedback.tflite';
// let audiofeedbackWasmModule;
const MODEL_URL = '/libs/audiofeedback/model.json';
const logger = getLogger(__filename);

export type { AudioFeedbackDetector };

export async function createAudioFeedbackDetector() {

    // if (!audiofeedbackWasmModule) {
    //     logger.info("createAudioFeedbackModule...");
    //     audiofeedbackWasmModule = createAudioFeedbackModule();
    // }

    // logger.info(audiofeedbackWasmModule);

    // return new AudioFeedbackDetector(audiofeedbackWasmModule)

    return tf.loadGraphModel(MODEL_URL)
            .then(model => {
                return new AudioFeedbackDetector(model);
            })
            .catch(error => {
                logger.info("FAILED WITH ERROR " + error);
            })

    // return audiofeedbackWasmModule
    //         .then(wasmModule =>{

    //             logger.info("loaded wasmModule...");

    //             let modelBufferLocation = wasmModule._getModelBufferMemoryOffset();

    //             return fetch(audiofeedbackTFLiteModel)
    //                 .then(response => {
    //                     logger.info("got tflite from libs");

    //                     return response.arrayBuffer().then(modelBuffer => {

    //                         logger.info("got array buffer");

    //                         wasmModule.HEAPU8.set(new Uint8Array(modelBuffer), modelBufferLocation);
    //                         wasmModule._loadModel(modelBuffer.byteLength);
    //                         return new AudioFeedbackDetector(wasmModule);
    //                     });
    //                 });
    //         })
    //         .catch(error => {
    //             logger.info("FAILED WITH ERROR " + error);
    //         });
}