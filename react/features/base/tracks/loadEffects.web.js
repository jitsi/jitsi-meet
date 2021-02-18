// @flow

import { createScreenshotCaptureEffect } from '../../stream-effects/screenshot-capture';
import { getBackgroundEffect } from '../../virtual-background';

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promsie} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: Object): Promise<any> {
    const state = store.getState();

    const backgroundPromise = state['features/virtual-background'].backgroundEffectEnabled
        ? getBackgroundEffect()
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();
    const screenshotCapturePromise = state['features/screenshot-capture']?.capturesEnabled
        ? createScreenshotCaptureEffect(state)
            .catch(error => {
                logger.error('Failed to obtain the screenshot capture effect effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    return Promise.all([ backgroundPromise, screenshotCapturePromise ]);
}
