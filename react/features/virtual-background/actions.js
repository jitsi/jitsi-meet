// @flow

import { getLocalVideoTrack } from '../base/tracks';
import { createVirtualBackgroundEffect } from '../stream-effects/virtual-background';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import logger from './logger';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background setted options.
 * @returns {Promise}
 */
export function toggleBackgroundEffect(options: Object) {
    return async function(dispatch: Object => Object, getState: () => any) {
        await dispatch(backgroundEnabled(options.enabled, options.blurValue));
        await dispatch(setVirtualBackground(options));
        const state = getState();
        const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);
        const virtualBackground = state['features/virtual-background'];

        try {
            if (options.enabled) {
                await jitsiTrack.setEffect(await createVirtualBackgroundEffect(virtualBackground));
            } else {
                await jitsiTrack.setEffect(undefined);
                dispatch(backgroundEnabled(false, 0));
            }
        } catch (error) {
            dispatch(backgroundEnabled(false, 0));
            logger.error('Error on apply backgroun effect:', error);
        }
    };
}

/**
 * Sets the selected virtual background image object.
 *
 * @param {Object} options - Represents the virtual background setted options.
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     isVirtualBackground: boolean,
 * }}
 */
export function setVirtualBackground(options: Object) {
    return {
        type: SET_VIRTUAL_BACKGROUND,
        virtualSource: options.virtualBackground.url,
        isVirtualBackground: options.virtualBackground.activated
    };
}

/**
 * Signals the local participant that the background effect has been enabled.
 *
 * @param {boolean} backgroundEffectEnabled - Indicate if virtual background effect is activated.
 * @param {number} blurValue - Indicate the setted blur value.
 * @returns {{
 *      type: BACKGROUND_ENABLED,
 *      backgroundEffectEnabled: boolean,
 *      blurValue: number
 * }}
 */
export function backgroundEnabled(backgroundEffectEnabled: boolean, blurValue: number) {
    return {
        type: BACKGROUND_ENABLED,
        backgroundEffectEnabled,
        blurValue
    };
}
