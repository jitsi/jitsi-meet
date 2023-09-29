import { IStore } from '../../app/types';
import { NoiseSuppressionEffect } from '../../stream-effects/noise-suppression/NoiseSuppressionEffect';
import { createVirtualBackgroundEffect } from '../../stream-effects/virtual-background';

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promise} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: IStore): Promise<any> {
    const state = store.getState();
    const virtualBackground = state['features/virtual-background'];
    const noiseSuppression = state['features/noise-suppression'];
    const { noiseSuppression: nsOptions } = state['features/base/config'];


    const backgroundPromise = virtualBackground.backgroundEffectEnabled
        ? createVirtualBackgroundEffect(virtualBackground)
            .catch((error: Error) => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    const noiseSuppressionPromise = noiseSuppression?.enabled
        ? Promise.resolve(new NoiseSuppressionEffect(nsOptions))
        : Promise.resolve();

    return Promise.all([ backgroundPromise, noiseSuppressionPromise ]);
}
