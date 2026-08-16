import { IStore } from '../app/types';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { createVirtualBackgroundEffect } from '../stream-effects/virtual-background';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import { VIRTUAL_BACKGROUND_TYPE } from './constants';
import logger from './logger';
import { IVirtualBackground } from './reducer';

/** Minimal shape of a JitsiLocalTrack needed for effect management. */
interface IJitsiTrack {
    setEffect: (effect?: Object) => Promise<void>;
}

/** Track parameter type — accepts the JitsiLocalTrack, Object (from legacy callers), or null. */
type TrackParam = IJitsiTrack | Object | null | undefined;

/**
 * Reverts the virtual background Redux state, clears the effect on the track, and shows an
 * error notification. Shared by the init-failure and runtime-failure paths.
 *
 * @param {Function} dispatch - Redux dispatch.
 * @param {IVirtualBackground} prevBackground - State snapshot taken before the failed toggle.
 * @param {IJitsiTrack} jitsiTrack - The video track to clear the effect from.
 * @param {string} reason - Human-readable reason for the failure (logged, not shown in UI).
 * @returns {Promise<void>}
 */
async function handleEffectFailure(
        dispatch: IStore['dispatch'],
        prevBackground: IVirtualBackground,
        jitsiTrack: TrackParam,
        reason: string): Promise<void> {
    logger.error(`[VirtualBackground] Effect failure: ${reason}`);

    dispatch(backgroundEnabled(prevBackground.backgroundEffectEnabled));
    dispatch(setVirtualBackground(prevBackground));

    if (jitsiTrack) {
        try {
            await (jitsiTrack as IJitsiTrack).setEffect(undefined);
        } catch (cleanupErr) {
            logger.warn('[VirtualBackground] Failed to clear effect after failure:', cleanupErr);
        }
    }

    dispatch(showWarningNotification(
        { titleKey: 'virtualBackground.backgroundEffectError' },
        NOTIFICATION_TIMEOUT_TYPE.LONG
    ));
}

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background set options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleBackgroundEffect(options: IVirtualBackground, jitsiTrack: TrackParam) {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const prevBackground = getState()['features/virtual-background'];

        dispatch(backgroundEnabled(options.backgroundEffectEnabled));
        dispatch(setVirtualBackground(options));
        const state = getState();
        const virtualBackground = state['features/virtual-background'];

        if (jitsiTrack) {
            const track = jitsiTrack as IJitsiTrack;

            try {
                if (options.backgroundEffectEnabled) {
                    const effect = await createVirtualBackgroundEffect(virtualBackground);

                    if (effect) {
                        effect.onInferenceFailure = () => {
                            handleEffectFailure(dispatch, prevBackground, jitsiTrack,
                                'persistent inference failure');
                        };
                    }

                    await track.setEffect(effect);
                    if (effect) {
                        await effect.initPromise;
                    }
                } else {
                    await track.setEffect(undefined);
                    dispatch(backgroundEnabled(false));
                }
            } catch (error) {
                await handleEffectFailure(dispatch, prevBackground, jitsiTrack,
                    String(error));
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
export function toggleBlurredBackgroundEffect(videoTrack: TrackParam, blurType: 'slight-blur' | 'blur' | 'none',
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

