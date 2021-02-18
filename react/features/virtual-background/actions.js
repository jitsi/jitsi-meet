// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import { getBackgroundEffect } from './functions';
import logger from './logger';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {boolean} enabled - If true enables video background, false otherwise.
 * @returns {Promise}
 */
export function toggleBackgroundEffect(enabled: boolean) {
    return async function(dispatch: Object => Object, getState: () => any) {
        const state = getState();

        const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);
        const virtualBackground = state['features/virtual-background'];

        try {
            if (enabled) {
                await jitsiTrack.setEffect(await getBackgroundEffect(virtualBackground));
                dispatch(backgroundEnabled(true));
            } else {
                await jitsiTrack.setEffect(undefined);
                dispatch(backgroundEnabled(false));
            }
        } catch (error) {
            dispatch(backgroundEnabled(false));
            logger.error('Error on apply backgroun effect:', error);
        }
    };
}

/**
 * Sets the selected virtual background image object.
 *
 * @param {Object} virtualSource - Virtual background image source.
 * @param {boolean} isVirtualBackground - Indicate if virtual image is activated.
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     isVirtualBackground: boolean,
 * }}
 */
export function setVirtualBackground(virtualSource: string, isVirtualBackground: boolean) {
    return {
        type: SET_VIRTUAL_BACKGROUND,
        virtualSource,
        isVirtualBackground
    };
}

/**
 * Signals the local participant that the background effect has been enabled.
 *
 * @param {boolean} backgroundEffectEnabled - Indicate if virtual background effect is activated.
 * @returns {{
 *      type: BACKGROUND_ENABLED,
 *      backgroundEffectEnabled: boolean,
 * }}
 */
export function backgroundEnabled(backgroundEffectEnabled: boolean) {
    return {
        type: BACKGROUND_ENABLED,
        backgroundEffectEnabled
    };
}
