import { IStore } from '../app/types';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { NoiseSuppressionEffect } from '../stream-effects/noise-suppression/NoiseSuppressionEffect';

import { SET_NOISE_SUPPRESSION_ENABLED } from './actionTypes';
import { canEnableNoiseSuppression, isNoiseSuppressionEnabled } from './functions';
import logger from './logger';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} enabled - Is noise suppression enabled.
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      enabled: boolean
 * }}
 */
export function setNoiseSuppressionEnabledState(enabled: boolean): any {
    return {
        type: SET_NOISE_SUPPRESSION_ENABLED,
        enabled
    };
}

/**
 *  Enabled/disable noise suppression depending on the current state.
 *
 * @returns {Function}
 */
export function toggleNoiseSuppression(): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (isNoiseSuppressionEnabled(getState())) {
            dispatch(setNoiseSuppressionEnabled(false));
        } else {
            dispatch(setNoiseSuppressionEnabled(true));
        }
    };
}

/**
 * Attempt to enable or disable noise suppression using the {@link NoiseSuppressionEffect}.
 *
 * @param {boolean} enabled - Enable or disable noise suppression.
 *
 * @returns {Function}
 */
export function setNoiseSuppressionEnabled(enabled: boolean): any {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        const { noiseSuppression: nsOptions } = state['features/base/config'];
        const localAudio = getLocalJitsiAudioTrack(state);
        const noiseSuppressionEnabled = isNoiseSuppressionEnabled(state);

        logger.info(`Attempting to set noise suppression enabled state: ${enabled}`);

        if (enabled === noiseSuppressionEnabled) {
            logger.warn(`Noise suppression enabled state already: ${enabled}`);

            return;
        }

        // If there is no local audio, simply set the enabled state. Once an audio track is created
        // the effects list will be applied.
        if (!localAudio) {
            dispatch(setNoiseSuppressionEnabledState(enabled));

            return;
        }

        try {
            if (enabled) {
                if (!canEnableNoiseSuppression(state, dispatch, localAudio)) {
                    return;
                }

                await localAudio.setEffect(new NoiseSuppressionEffect(nsOptions));
                dispatch(setNoiseSuppressionEnabledState(true));
                logger.info('Noise suppression enabled.');

            } else {
                await localAudio.setEffect(undefined);
                dispatch(setNoiseSuppressionEnabledState(false));
                logger.info('Noise suppression disabled.');
            }
        } catch (error) {
            logger.error(
                `Failed to set noise suppression enabled to: ${enabled}`,
                error
            );

            dispatch(showErrorNotification({
                titleKey: 'notify.noiseSuppressionFailedTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    };
}
