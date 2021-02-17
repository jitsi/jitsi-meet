// @flow

import * as wasmCheck from 'wasm-check';

import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import createTFLiteModule from './vendor/tflite/tflite';
import createTFLiteSIMDModule from './vendor/tflite/tflite-simd';

const models = {
    '96': '/libs/segm_lite_v681.tflite',
    '144': '/libs/segm_full_v679.tflite'
};

/**
 * Creates a new instance of JitsiStreamBlurEffect. This loads the bodyPix model that is used to
 * extract person segmentation.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export async function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamBlurEffect not supported!');
    }
    let tflite;

    if (wasmCheck.feature.simd) {
        tflite = await createTFLiteSIMDModule();
    } else {
        tflite = await createTFLiteModule();
    }

    const modelBufferOffset = tflite._getModelBufferMemoryOffset();
    const modelResponse = await fetch(
        models['144']
    );

    const model = await modelResponse.arrayBuffer();

    tflite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);

    tflite._loadModel(model.byteLength);

    return new JitsiStreamBlurEffect(tflite);
}
