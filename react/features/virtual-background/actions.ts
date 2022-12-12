import { IStore } from '../app/types';
import { executeTrackOperation } from '../base/tracks/actions';
import { getLocalJitsiVideoTrack } from '../base/tracks/functions.any';
import { TrackOperationType } from '../base/tracks/types';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { createVirtualBackgroundEffect } from '../stream-effects/virtual-background';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import logger from './logger';
import { IVirtualBackgroundOptions } from './types';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background set options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleBackgroundEffect(options: IVirtualBackgroundOptions, jitsiTrack: any) {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        await dispatch(backgroundEnabled(options.enabled));
        await dispatch(setVirtualBackground(options));
        const state = getState();
        const virtualBackground = state['features/virtual-background'];

        if (jitsiTrack) {
            try {
                if (options.enabled) {
                    await jitsiTrack.setEffect(await createVirtualBackgroundEffect(virtualBackground, dispatch));
                } else {
                    await jitsiTrack.setEffect(undefined);
                    dispatch(backgroundEnabled(false));
                }
            } catch (error) {
                dispatch(backgroundEnabled(false));
                logger.error('Error on apply background effect:', error);
            }
        }
    };
}


/**
 * Adds a track operation to enable/disable the virtual background for the local video.
 *
 * @param {Object} options - Represents the virtual background set options.
 * @returns {Function}
 */
export function toggleBackgroundEffectForTheLocalTrack(options: IVirtualBackgroundOptions) {
    return function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        return dispatch(executeTrackOperation(TrackOperationType.Video, () => {
            const localVideo = getLocalJitsiVideoTrack(getState());

            return dispatch(toggleBackgroundEffect(options, localVideo));
        }));
    };
}

/**
 * Sets the selected virtual background image object.
 *
 * @param {Object} options - Represents the virtual background set options.
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     blurValue: number,
 *     type: string,
 * }}
 */
export function setVirtualBackground(options?: IVirtualBackgroundOptions) {
    return {
        type: SET_VIRTUAL_BACKGROUND,
        virtualSource: options?.url,
        blurValue: options?.blurValue,
        backgroundType: options?.backgroundType,
        selectedThumbnail: options?.selectedThumbnail
    };
}

/**
 * Signals the local participant that the background effect has been enabled.
 *
 * @param {boolean} backgroundEffectEnabled - Indicate if virtual background effect is activated.
 * @returns {{
 *      type: BACKGROUND_ENABLED,
 *      backgroundEffectEnabled: boolean
 * }}
 */
export function backgroundEnabled(backgroundEffectEnabled: boolean) {
    return {
        type: BACKGROUND_ENABLED,
        backgroundEffectEnabled
    };
}
