import { IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import { handleToggleVideoMuted } from '../toolbox/actions.any';
import { muteLocal } from '../video-menu/actions.any';

import { SET_PIP_ACTIVE } from './actionTypes';
import {
    cleanupMediaSessionHandlers,
    enterPiP,
    isAudioMutedForPiP,
    isVideoMutedForPiP,
    setupMediaSessionHandlers
} from './functions';
import logger from './logger';

/**
 * Action to set Picture-in-Picture active state.
 *
 * @param {boolean} isPiPActive - Whether PiP is active.
 * @returns {{
 *     type: SET_PIP_ACTIVE,
 *     isPiPActive: boolean
 * }}
 */
export function setPiPActive(isPiPActive: boolean) {
    return {
        type: SET_PIP_ACTIVE,
        isPiPActive
    };
}

/**
 * Toggles audio mute from PiP MediaSession controls.
 * Uses exact same logic as toolbar audio button including GUM pending state.
 *
 * @returns {Function}
 */
export function toggleAudioFromPiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const audioMuted = isAudioMutedForPiP(state);

        // Use the exact same action as toolbar button.
        dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO));
    };
}

/**
 * Toggles video mute from PiP MediaSession controls.
 * Uses exact same logic as toolbar video button including GUM pending state.
 *
 * @returns {Function}
 */
export function toggleVideoFromPiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const videoMuted = isVideoMutedForPiP(state);

        // Use the exact same action as toolbar button (showUI=true, ensureTrack=true).
        dispatch(handleToggleVideoMuted(!videoMuted, true, true));
    };
}

/**
 * Action to exit Picture-in-Picture mode.
 *
 * @returns {Function}
 */
export function exitPiP() {
    return async (dispatch: IStore['dispatch']) => {
        // Check if there's been recent user interaction.
        // requestPictureInPicture() requires a user gesture for security.
        if ('userActivation' in navigator && !(navigator.userActivation as any).isActive) {
            logger.debug('Skipping PiP - no recent user interaction detected');

            return;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                logger.log('Exited Picture-in-Picture mode');
            }
            dispatch(setPiPActive(false));
            cleanupMediaSessionHandlers();
        } catch (error) {
            logger.error('Error exiting Picture-in-Picture:', error);
        }
    };
}

/**
 * Action to handle window blur or tab switch.
 * Enters PiP mode if not already active.
 *
 * @param {HTMLVideoElement} videoElement - The video element we will use for PiP.
 * @returns {Function}
 */
export function handleWindowBlur(videoElement: HTMLVideoElement) {
    return (_dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;

        if (!isPiPActive) {
            enterPiP(videoElement);
        }
    };
}

/**
 * Action to handle user interaction with the page.
 * Exits PiP mode if currently active.
 *
 * @returns {Function}
 */
export function handleUserInteraction() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;

        if (isPiPActive) {
            dispatch(exitPiP());
        }
    };
}

/**
 * Action to handle the browser's leavepictureinpicture event.
 * Updates state and cleans up MediaSession handlers.
 *
 * @returns {Function}
 */
export function handlePiPLeaveEvent() {
    return (dispatch: IStore['dispatch']) => {
        dispatch(setPiPActive(false));
        cleanupMediaSessionHandlers();
    };
}

/**
 * Action to handle the browser's enterpictureinpicture event.
 * Updates state and sets up MediaSession handlers.
 *
 * @returns {Function}
 */
export function handlePipEnterEvent() {
    return (dispatch: IStore['dispatch']) => {
        logger.log('Entered Picture-in-Picture mode');

        dispatch(setPiPActive(true));
        setupMediaSessionHandlers(dispatch);
    };
}
