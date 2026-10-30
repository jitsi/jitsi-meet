import { IStore } from '../app/types';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions';
import { showErrorNotification } from '../notifications/actions';
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
 * The last queued noise suppression change. The enabled state is only updated once the effect has been applied to
 * (or removed from) the local audio track, so changes are run one after another, otherwise back-to-back calls would
 * all see the same, stale, state.
 */
let pendingChange: Promise<void> = Promise.resolve();

/**
 * Runs the given noise suppression change once all the previously queued ones have finished.
 *
 * @param {Function} change - The change to run.
 * @returns {Promise<void>}
 */
function queueChange(change: () => Promise<void>): Promise<void> {
    const result = pendingChange.then(change);

    // Keep the queue going even if a change fails, the failure is still reported to the caller through result.
    pendingChange = result.catch(() => undefined);

    return result;
}

/**
 *  Enabled/disable noise suppression depending on the current state.
 *
 * @returns {Function}
 */
export function toggleNoiseSuppression(): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) =>

        // The state is read only when the change runs, so that it reflects any previously queued change.
        queueChange(() => dispatch(applyNoiseSuppressionEnabled(!isNoiseSuppressionEnabled(getState()))));
}

/**
 * Attempt to enable or disable noise suppression using the {@link NoiseSuppressionEffect}.
 *
 * @param {boolean} enabled - Enable or disable noise suppression.
 *
 * @returns {Function}
 */
export function setNoiseSuppressionEnabled(enabled: boolean): any {
    return (dispatch: IStore['dispatch']) => queueChange(() => dispatch(applyNoiseSuppressionEnabled(enabled)));
}

/**
 * Enables or disables noise suppression by applying or removing the {@link NoiseSuppressionEffect} on the local
 * audio track. Must only be run through {@link queueChange}.
 *
 * @param {boolean} enabled - Enable or disable noise suppression.
 *
 * @returns {Function}
 */
function applyNoiseSuppressionEnabled(enabled: boolean): any {
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
            }));
        }
    };
}
