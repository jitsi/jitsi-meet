/* eslint-disable lines-around-comment */
import { IStore } from '../../app/types';
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { timeout } from '../../virtual-background/functions';
import logger from '../../virtual-background/logger';

import { DeviceTier, detectDeviceTier } from './DeviceTierDetector.web';
import JitsiStreamBackgroundEffect, { IBackgroundEffectOptions } from './JitsiStreamBackgroundEffect';
import JitsiStreamBackgroundEffectV2 from './JitsiStreamBackgroundEffectV2';
// @ts-ignore
import createTFLiteModule from './vendor/tflite/tflite';
// @ts-ignore
import createTFLiteSIMDModule from './vendor/tflite/tflite-simd';
/* eslint-enable lines-around-comment */

const models = {
    modelLandscape: 'libs/selfie_segmentation_landscape.tflite'
};

let modelBuffer: ArrayBuffer;
let tflite: any;
let wasmCheck;
let isWasmDisabled = false;

const segmentationDimensions = {
    modelLandscape: {
        height: 144,
        width: 256
    }
};

/**
 * Creates a new V1 instance of JitsiStreamBackgroundEffect. This loads the Meet background model that is used to
 * extract person segmentation.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect | undefined>}
 */
async function createVirtualBackgroundEffectV1(virtualBackground: IBackgroundEffectOptions['virtualBackground'],
        dispatch?: IStore['dispatch']): Promise<JitsiStreamBackgroundEffect | undefined> {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamBackgroundEffect not supported!');
    }

    if (isWasmDisabled) {
        dispatch?.(showWarningNotification({
            titleKey: 'virtualBackground.backgroundEffectError'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        return;
    }

    // Checks if WebAssembly feature is supported or enabled by/in the browser.
    // Conditional import of wasm-check package is done to prevent
    // the browser from crashing when the user opens the app.

    if (!tflite) {
        try {
            wasmCheck = require('wasm-check');
            const tfliteTimeout = 10000;

            if (wasmCheck?.feature?.simd) {
                tflite = await timeout(tfliteTimeout, createTFLiteSIMDModule());
            } else {
                tflite = await timeout(tfliteTimeout, createTFLiteModule());
            }
        } catch (err: any) {
            if (err?.message === '408') {
                logger.error('Failed to download tflite model!');
                dispatch?.(showWarningNotification({
                    titleKey: 'virtualBackground.backgroundEffectError'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));
            } else {
                isWasmDisabled = true;
                logger.error('Looks like WebAssembly is disabled or not supported on this browser', err);
                dispatch?.(showWarningNotification({
                    titleKey: 'virtualBackground.webAssemblyWarning',
                    descriptionKey: 'virtualBackground.webAssemblyWarningDescription'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));
            }

            return;
        }
    }

    if (!modelBuffer) {
        const modelResponse = await fetch(models.modelLandscape);

        if (!modelResponse.ok) {
            throw new Error('Failed to download tflite model!');
        }

        modelBuffer = await modelResponse.arrayBuffer();

        tflite.HEAPU8.set(new Uint8Array(modelBuffer), tflite._getModelBufferMemoryOffset());

        tflite._loadModel(modelBuffer.byteLength);
    }

    const options = {
        ...segmentationDimensions.modelLandscape,
        virtualBackground
    };

    return new JitsiStreamBackgroundEffect(tflite, options);
}

/**
 * Creates a new V2 instance of the virtual background effect.
 *
 * Device tier detection runs first and selects the appropriate backend. All tiers run inference
 * inside a dedicated VBInferenceWorker: LOW tier uses TFLite WASM (selfie_segmenter FP16) and MEDIUM/HIGH
 * tiers use TF.js with WebGL/WebGPU backends. Pre-detected capabilities are passed to the
 * constructor so {@link JitsiStreamBackgroundEffectV2._initAsync} does not need to re-probe.
 *
 * @param {Object} virtualBackground - The virtual background options.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffectV2 | undefined>}
 */
async function createVirtualBackgroundEffectV2(
        virtualBackground: IBackgroundEffectOptions['virtualBackground'],
        dispatch?: IStore['dispatch']
): Promise<JitsiStreamBackgroundEffect | JitsiStreamBackgroundEffectV2 | undefined> {
    const config = APP.store.getState()['features/base/config'];

    let capabilities;

    try {
        capabilities = await detectDeviceTier(config);
    } catch (err) {
        logger.error('[VirtualBackground] Device tier detection failed', err);
        dispatch?.(showWarningNotification({
            titleKey: 'virtualBackground.backgroundEffectError'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        return;
    }

    if (capabilities.tier === DeviceTier.UNSUPPORTED) {
        logger.warn('[VirtualBackground] No supported GPU or WASM backend — virtual background unavailable');
        dispatch?.(showWarningNotification({
            titleKey: 'virtualBackground.backgroundEffectError'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        return;
    }

    return new JitsiStreamBackgroundEffectV2(virtualBackground, config, capabilities);
}

/**
 * Creates a new instance of the virtual background stream effect. Delegates to V1 (TFLite WASM) or
 * V2 (MediaPipe body-segmentation + WebGL) based on the {@code virtualBackground.enableV2} config flag.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect | JitsiStreamBackgroundEffectV2 | undefined>}
 */
export async function createVirtualBackgroundEffect(
        virtualBackground: IBackgroundEffectOptions['virtualBackground'],
        dispatch?: IStore['dispatch']
): Promise<JitsiStreamBackgroundEffect | JitsiStreamBackgroundEffectV2 | undefined> {
    const config = APP.store.getState()['features/base/config'];

    if (config.virtualBackground?.enableV2) {
        logger.info('[VirtualBackground] Using V2 engine (MediaPipe body-segmentation + WebGL)');

        return createVirtualBackgroundEffectV2(virtualBackground, dispatch);
    }

    logger.info('[VirtualBackground] Using V1 engine (TFLite WASM)');

    return createVirtualBackgroundEffectV1(virtualBackground, dispatch);
}
