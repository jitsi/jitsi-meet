/* eslint-disable lines-around-comment */
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { timeout } from '../../virtual-background/functions';
import logger from '../../virtual-background/logger';
import { IVirtualBackground } from '../../virtual-background/reducer';

import { detectDeviceTier } from './DeviceTierDetector';
import JitsiStreamBackgroundEffect from './JitsiStreamBackgroundEffect';
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
let wasmCheck: any;
let isWasmDisabled = false;

/**
 * Creates a new instance of the virtual background stream effect.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise<JitsiStreamBackgroundEffect | undefined>}
 */
export async function createVirtualBackgroundEffect(virtualBackground: IVirtualBackground,
        dispatch?: Function
): Promise<JitsiStreamBackgroundEffect | undefined> {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamBackgroundEffect not supported!');
    }
    const vbConfig = APP.store.getState()['features/base/config'].virtualBackground;

    if (vbConfig?.enableV2) {
        const capabilities = await detectDeviceTier(vbConfig);

        logger.info(
            '[VirtualBackground] Using V2 engine —'
            + ` tier: ${capabilities.tier}, backend: ${capabilities.backend}`
        );

        const effect = new JitsiStreamBackgroundEffect(undefined, virtualBackground, {
            capabilities,
            vbConfig
        });

        await effect.init();

        return effect;
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

    return new JitsiStreamBackgroundEffect(tflite, virtualBackground);
}
