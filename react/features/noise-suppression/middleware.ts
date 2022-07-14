/* eslint-disable lines-around-comment */
import { IState, IStore } from '../app/types';
// @ts-ignore
import { MiddlewareRegistry } from '../base/redux';
// @ts-ignore
import { getLocalJitsiAudioTrack } from '../base/tracks';
// @ts-ignore
import { NOTIFICATION_TIMEOUT_TYPE, showErrorNotification, showWarningNotification } from '../notifications';
// @ts-ignore
import { isScreenAudioShared } from '../screen-share';
// @ts-ignore
import { NoiseSuppressionEffect } from '../stream-effects/noise-suppression/NoiseSuppressionEffect';

import { SET_NOISE_SUPPRESSION_ENABLED } from './actionTypes';
import { isNoiseSuppressionEnabled } from './functions';
import logger from './logger';

/**
 * Verify if noise suppression can be enabled in the current state.
 *
 * @param {*} state - Redux state.
 * @param {*} dispatch - Redux dispatch.
 * @param {*} localAudio - Current local audio track.
 * @returns {boolean}
 */
function canEnableNoiseSuppression(state: IState, dispatch: Function, localAudio: any) : boolean {
    const { channelCount } = localAudio.track.getSettings();

    // Sharing screen audio implies an effect being applied to the local track, because currently we don't support
    // more then one effect at a time the user has to choose between sharing audio or having noise suppression active.
    if (isScreenAudioShared(state)) {
        dispatch(showWarningNotification({
            titleKey: 'notify.noiseSuppressionFailedTitle',
            descriptionKey: 'notify.noiseSuppressionDesktopAudioDescription'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return false;
    }

    // Stereo audio tracks aren't currently supported, make sure the current local track is mono
    if (channelCount > 1) {
        dispatch(showWarningNotification({
            titleKey: 'notify.noiseSuppressionFailedTitle',
            descriptionKey: 'notify.noiseSuppressionStereoDescription'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return false;
    }

    return true;
}
/**
 * Set the SET_NOISE_SUPPRESSION_ENABLED state to disabled and return the next function up the chain.
 *
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Function}
 */
function disableNSState(next: Function, action: any) {
    action.enabled = false;

    return next(action);
}

/**
 * Implements middleware for the noise suppression feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => async (action: any) => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case SET_NOISE_SUPPRESSION_ENABLED: {
        const state = getState();
        const { enabled } = action;
        const noiseSuppressionEnabled = isNoiseSuppressionEnabled(state);
        const localAudio = getLocalJitsiAudioTrack(state);

        logger.info(`Attempting to set noise suppression enabled state: ${noiseSuppressionEnabled}`);

        if (!localAudio) {
            logger.warn('Can not toggle noise suppression without any local track active.');

            dispatch(showWarningNotification({
                titleKey: 'notify.noiseSuppressionFailedTitle',
                descriptionKey: 'notify.noiseSuppressionNoTrackDescription'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

            return disableNSState(next, action);
        }
        try {
            if (enabled && !noiseSuppressionEnabled) {
                if (!canEnableNoiseSuppression(state, dispatch, localAudio)) {
                    return disableNSState(next, action);
                }

                await localAudio.setEffect(new NoiseSuppressionEffect());
                logger.info('Noise suppression enabled.');

            } else if (noiseSuppressionEnabled) {
                await localAudio.setEffect(undefined);
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

            return disableNSState(next, action);
        }

        break;
    }
    }

    return next(action);
});

