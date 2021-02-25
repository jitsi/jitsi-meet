// @flow

import * as wasmCheck from 'wasm-check';

import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import createTFLiteModule from './vendor/tflite/tflite';
import createTFLiteSIMDModule from './vendor/tflite/tflite-simd';

const models = {
    'model96': 'libs/segm_lite_v681.tflite',
    'model144': 'libs/segm_full_v679.tflite'
};

const segmentationDimensions = {
    'model96': {
        'height': 96,
        'width': 160
    },
    'model144': {
        'height': 144,
        'width': 256
    }
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
        wasmCheck.feature.simd ? models.model144 : models.model96
    );

    if (!modelResponse.ok) {
        throw new Error('Failed to download tflite model!');
    }

    const model = await modelResponse.arrayBuffer();

    tflite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);

    tflite._loadModel(model.byteLength);

    const options = wasmCheck.feature.simd ? segmentationDimensions.model144 : segmentationDimensions.model96;

    return new JitsiStreamBlurEffect(tflite, options);
}
