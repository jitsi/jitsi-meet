import { IStore } from '../app/types';
import { createVirtualBackgroundEffect } from '../stream-effects/virtual-background';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import { VIRTUAL_BACKGROUND_TYPE } from './constants';
import logger from './logger';
import { IVirtualBackground } from './reducer';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background set options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleBackgroundEffect(options: IVirtualBackground, jitsiTrack: any) {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        dispatch(backgroundEnabled(options.backgroundEffectEnabled));
        dispatch(setVirtualBackground(options));
        const state = getState();
        const virtualBackground = state['features/virtual-background'];

        if (jitsiTrack) {
            try {
                if (options.backgroundEffectEnabled) {
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
export function setVirtualBackground(options?: IVirtualBackground) {
    return {
        type: SET_VIRTUAL_BACKGROUND,
        virtualSource: options?.virtualSource,
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
export function backgroundEnabled(backgroundEffectEnabled?: boolean) {
    return {
        type: BACKGROUND_ENABLED,
        backgroundEffectEnabled
    };
}

/**
 * Simulates blurred background selection/removal on video background. Used by API only.
 *
 * @param {JitsiLocalTrack} videoTrack - The targeted video track.
 * @param {string} [blurType] - Blur type to apply. Accepted values are 'slight-blur', 'blur' or 'none'.
 * @param {boolean} muted - Muted state of the video track.
 * @returns {Promise}
 */
export function toggleBlurredBackgroundEffect(videoTrack: any, blurType: 'slight-blur' | 'blur' | 'none',
        muted: boolean) {
    return async function(dispatch: IStore['dispatch'], _getState: IStore['getState']) {
        if (muted || !videoTrack || !blurType) {
            return;
        }

        if (blurType === 'none') {
            dispatch(toggleBackgroundEffect({
                backgroundEffectEnabled: false,
                selectedThumbnail: blurType
            }, videoTrack));
        } else {
            dispatch(toggleBackgroundEffect({
                backgroundEffectEnabled: true,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
                blurValue: blurType === 'blur' ? 25 : 8,
                selectedThumbnail: blurType
            }, videoTrack));
        }
    };
}
