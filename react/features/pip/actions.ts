import { IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { startScreenShareFlow } from '../screen-share/actions.web';
import { isScreenVideoShared } from '../screen-share/functions';
import { handleToggleVideoMuted } from '../toolbox/actions.any';
import { muteLocal } from '../video-menu/actions.any';

import { SET_PIP_ACTIVE } from './actionTypes';
import { isDocumentPiPSupported } from './external-api.shared';
import {
    cleanupMediaSessionHandlers,
    closeDocumentPiP,
    enterPiP,
    openDocumentPiP,
    setupMediaSessionHandlers,
    shouldShowPiP
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
        const audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);

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
        const videoMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO);

        // Use the exact same action as toolbar button (showUI=true, ensureTrack=true).
        dispatch(handleToggleVideoMuted(!videoMuted, true, true));
    };
}

/**
 * Toggles screen sharing from PiP controls.
 * Uses exact same logic as the toolbar share-desktop button.
 *
 * @returns {Function}
 */
export function toggleScreenShareFromPiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const screenSharing = isScreenVideoShared(state);

        // Use the exact same action as toolbar button.
        dispatch(startScreenShareFlow(!screenSharing));
    };
}

/**
 * Action to exit Picture-in-Picture mode.
 *
 * @returns {Function}
 */
export function exitPiP() {
    return (dispatch: IStore['dispatch']) => {
        logger.debug('exitPiP called');

        closeDocumentPiP();

        if (document.pictureInPictureElement) {
            document.exitPictureInPicture()
            .then(() => {
                logger.debug('Exited Picture-in-Picture mode');
            })
            .catch((err: Error) => {
                logger.error(`Error while exiting PiP: ${err.message}`);
            });
        }

        dispatch(setPiPActive(false));
        cleanupMediaSessionHandlers();
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

        logger.debug(`Window blur detected, isPiPActive=${isPiPActive}`);

        if (!isPiPActive) {
            enterPiP(videoElement);
        }
    };
}

/**
 * Action to handle window focus.
 * Exits PiP mode if currently active (matches old AOT behavior).
 *
 * @returns {Function}
 */
export function handleWindowFocus() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;

        logger.debug(`Window focus detected, isPiPActive=${isPiPActive}`);

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
        logger.log('Left Picture-in-Picture mode');

        dispatch(setPiPActive(false));
        cleanupMediaSessionHandlers();
        APP.API.notifyPictureInPictureLeft();
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
        APP.API.notifyPictureInPictureEntered();
    };
}

/**
 * Shows Picture-in-Picture window.
 * Called from external API when iframe becomes not visible (IntersectionObserver).
 *
 * @returns {Function}
 */
export function showPiP() {
    return (_dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;
        const _shouldShowPip = shouldShowPiP(state);

        logger.debug(`showPiP called, shouldShow=${_shouldShowPip}, isPiPActive=${isPiPActive}`);

        if (!_shouldShowPip) {
            return;
        }

        if (!isPiPActive) {
            const videoElement = document.getElementById('pipVideo') as HTMLVideoElement;

            if (!videoElement) {
                logger.warn('showPiP: pipVideo element not found');

                return;
            }

            enterPiP(videoElement);
        }
    };
}

/**
 * Hides Picture-in-Picture window.
 * Called from external API when iframe becomes visible.
 *
 * @returns {Function}
 */
export function hidePiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;

        logger.debug(`hidePiP called, isPiPActive=${isPiPActive}`);

        if (isPiPActive) {
            dispatch(exitPiP());
        }
    };
}

/**
 * Toggles Picture-in-Picture from a user gesture (toolbar button).
 * Entering from a real click satisfies the browser's transient activation
 * requirement; afterwards the video's `autoPictureInPicture` attribute keeps
 * it working on subsequent tab switches without further gestures.
 *
 * @returns {Function}
 */
export function togglePiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const isPiPActive = getState()['features/pip']?.isPiPActive;

        if (isPiPActive) {
            dispatch(exitPiP());

            return;
        }

        // Prefer the rich Document PiP window (Google Meet style) when available.
        if (isDocumentPiPSupported()) {
            dispatch(enterDocumentPiP());

            return;
        }

        const videoElement = document.getElementById('pipVideo') as HTMLVideoElement;

        if (!videoElement) {
            logger.warn('togglePiP: pipVideo element not found');

            return;
        }

        enterPiP(videoElement);
    };
}

/**
 * Opens the rich Document Picture-in-Picture window and updates state.
 *
 * @returns {Function}
 */
export function enterDocumentPiP() {
    return async (dispatch: IStore['dispatch']) => {
        const pipWindow = await openDocumentPiP(() => dispatch(setPiPActive(false)));

        if (pipWindow) {
            dispatch(setPiPActive(true));
            APP.API.notifyPictureInPictureEntered();
        }
    };
}

/**
 * Closes the rich Document Picture-in-Picture window and updates state.
 *
 * @returns {Function}
 */
export function exitDocumentPiP() {
    return (dispatch: IStore['dispatch']) => {
        closeDocumentPiP();
        dispatch(setPiPActive(false));
        APP.API.notifyPictureInPictureLeft();
    };
}
