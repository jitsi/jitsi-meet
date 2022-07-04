import { MiddlewareRegistry } from '../base/redux';
import { getLocalJitsiAudioTrack } from '../base/tracks';
import { NoiseSuppressionEffect } from '../stream-effects/noise-suppression/NoiseSuppressionEffect';

import { TOGGLE_NOISE_SUPPRESSION } from './actionTypes';
import { setNoiseSuppressionState } from './actions';
import { isNoiseSuppressionActive } from './functions';
import logger from './logger';

/**
 * Implements middleware for the noise suppression feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => async action => {
    const result = next(action);

    switch (action.type) {
    case TOGGLE_NOISE_SUPPRESSION: {

        const state = getState();
        const noiseSuppressionActive = isNoiseSuppressionActive(state);
        const localAudio = getLocalJitsiAudioTrack(state);

        if (!localAudio) {
            logger.warn('Can not toggle noise suppression without any local track active.');

            return;
        }

        try {
            if (noiseSuppressionActive) {
                await localAudio.setEffect(undefined);
                dispatch(setNoiseSuppressionState(false));
                logger.info('Noise suppression disabled.');
            } else {
                await localAudio.setEffect(new NoiseSuppressionEffect());
                dispatch(setNoiseSuppressionState(true));
                logger.info('Noise suppression enabled.');
            }
        } catch (error) {
            logger.error(
                `Failed to toggle noise suppression to active state: ${!noiseSuppressionActive}`,
                error
            );
        }

        break;
    }
    }

    return result;
});

