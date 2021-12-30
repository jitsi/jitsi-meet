// @flow

import { createVirtualBackgroundEffect } from '../../stream-effects/virtual-background';
import { getVideoEffectFiltersInstance } from '../../video-effect-filters';
import { BUNNY_EARS_ENABLED } from '../../video-effect-filters/actionTypes'

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promsie} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: Object): Promise<any> {
    const state = store.getState();
    const virtualBackground = state['features/virtual-background'];

    const backgroundPromise = virtualBackground.backgroundEffectEnabled
        ? createVirtualBackgroundEffect(virtualBackground)
            .catch(error => {
                logger.error('Failed to obtain the background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();
	const videoEffectFiltersPromise = state['features/video-effect-filters'].currentVideoEffectFilter == BUNNY_EARS_ENABLED
		? getVideoEffectFiltersInstance()
			.catch(error => {
				logger.error('Failed to obtain the video effect filter instance with error: ', error);
			
				return Promise.resolve();
			})
		: Promise.resolve();

    return Promise.all([ backgroundPromise, videoEffectFiltersPromise ]);
}
