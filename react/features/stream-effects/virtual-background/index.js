// @flow

import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications';
import { showWarningNotification } from '../../notifications/actions';
import { timeout } from '../../virtual-background/functions';
import logger from '../../virtual-background/logger';

import JitsiStreamBackgroundEffect from './JitsiStreamBackgroundEffect';
import createTFLiteModule from './vendor/tflite/tflite';
import createTFLiteSIMDModule from './vendor/tflite/tflite-simd';
const models = {
    modelLandscape: 'libs/selfie_segmentation_landscape.tflite'
};

let tflite;
let wasmCheck;
let isWasmDisabled = false;

const segmentationDimensions = {
    modelLandscape: {
        height: 144,
        width: 256
    }
};

/**
 * Creates a new instance of JitsiStreamBackgroundEffect. This loads the Meet background model that is used to
 * extract person segmentation.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect>}
 */
export async function createVirtualBackgroundEffect(virtualBackground: Object, dispatch: Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamBackgroundEffect not supported!');
    }

    // Checks if WebAssembly feature is supported or enabled by/in the browser.
    // Conditional import of wasm-check package is done to prevent
    // the browser from crashing when the user opens the app.

    if (!tflite && !isWasmDisabled) {
        try {
            wasmCheck = require('wasm-check');
            const tfliteTimeout = 10000;

            if (wasmCheck?.feature?.simd) {
                tflite = await timeout(tfliteTimeout, createTFLiteSIMDModule());
            } else {
                tflite = await timeout(tfliteTimeout, createTFLiteModule());
            }
        } catch (err) {
            isWasmDisabled = true;

            if (err?.message === '408') {
                logger.error('Failed to download tflite model!');
                dispatch(showWarningNotification({
                    titleKey: 'virtualBackground.backgroundEffectError'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));
            } else {
                logger.error('Looks like WebAssembly is disabled or not supported on this browser', err);
                dispatch(showWarningNotification({
                    titleKey: 'virtualBackground.webAssemblyWarning',
                    descriptionKey: 'virtualBackground.webAssemblyWarningDescription'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));
            }

            return;
        }
    } else if (isWasmDisabled) {
        dispatch(showWarningNotification({
            titleKey: 'virtualBackground.backgroundEffectError'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        return;
    }

    const modelBufferOffset = tflite._getModelBufferMemoryOffset();
    const modelResponse = await fetch(models.modelLandscape);

    if (!modelResponse.ok) {
        throw new Error('Failed to download tflite model!');
    }

    const model = await modelResponse.arrayBuffer();

    tflite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);

    tflite._loadModel(model.byteLength);

    const options = {
        ...segmentationDimensions.modelLandscape,
        virtualBackground
    };

    return new JitsiStreamBackgroundEffect(tflite, options);
}
