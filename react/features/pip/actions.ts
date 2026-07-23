import { IStore } from '../app/types';
import { leaveConference } from '../base/conference/actions';
import { MEDIA_TYPE } from '../base/media/constants';
import { IGUMPendingState } from '../base/media/types';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { showErrorNotification } from '../notifications/actions';

import { isEmbedded } from '../base/util/embedUtils';
import { handleToggleVideoMuted } from '../toolbox/actions.any';
import { isAudioMuteButtonDisabled, isVideoMuteButtonDisabled } from '../toolbox/functions';
import { muteLocal } from '../video-menu/actions.any';

import { DEFAULT_DOCUMENT_PIP_HEIGHT, DEFAULT_DOCUMENT_PIP_WIDTH } from './constants';
import {
    EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED,
    EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED,
    EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED,
    EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED,
    SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY,
    SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE,
    SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY,
    SET_PIP_ACTIVE
} from './actionTypes';
import { isEmbeddedDocumentPiPAvailable } from './embeddedDocumentPiP';
import {
    cleanupMediaSessionHandlers,
    clearPiPWindow,
    closeDocumentPiPWindow,
    enterVideoPiP,
    getStoredPiPWindow,
    initPiPWindow,
    isDocumentPiPRequestPending,
    isDocumentPiPSupported,
    setDocumentPiPRequestPending,
    setupMediaSessionHandlers,
    shouldShowPiP,
} from './functions';
import logger from './logger';
import type { IWebKitPictureInPictureVideoElement } from './types';
import { EmbeddedDocumentPiPCapability, EmbeddedDocumentPiPLifecycle } from './types';

interface IOpenDocumentPiPOptions {
    notifyOnFailure?: boolean;
}

/**
 * Flag to track if a Document PiP request is currently pending.
 * Prevents duplicate requestWindow() calls before the first one resolves.
 */

let docPiPPending = false;
let embeddedDocumentPiPRequestTimer: number | undefined;

const EMBEDDED_DOCUMENT_PIP_REQUEST_TIMEOUT = 10000;

/**
 * Clears the host-assisted Document PiP request guard.
 *
 * @returns {void}
 */
export function clearEmbeddedDocumentPiPRequestTimer() {
    if (embeddedDocumentPiPRequestTimer) {
        window.clearTimeout(embeddedDocumentPiPRequestTimer);
        embeddedDocumentPiPRequestTimer = undefined;
    }
}

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

export function setEmbeddedDocumentPiPCapability(capability: EmbeddedDocumentPiPCapability) {
    return {
        type: SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY,
        capability
    };
}

export function setEmbeddedDocumentPiPLifecycle(lifecycle: EmbeddedDocumentPiPLifecycle) {
    return {
        type: SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE,
        lifecycle
    };
}

export function setEmbeddedDocumentPiPRendererReady(ready: boolean) {
    return {
        type: SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY,
        ready
    };
}

export function handleEmbeddedDocumentPiPCapability(available: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const wasActive = getState()['features/pip']?.isPiPActive;
        const capability = available
            ? EmbeddedDocumentPiPCapability.AVAILABLE
            : EmbeddedDocumentPiPCapability.UNAVAILABLE;

        logger.info('Embedded Document PiP capability resolved:', capability);
        if (!available) {
            clearEmbeddedDocumentPiPRequestTimer();
        }
        dispatch(setEmbeddedDocumentPiPCapability(capability));

        if (!available && wasActive) {
            APP.API.notifyDocumentPiPClose();
        }
    };
}

/**
 * Resolves an unanswered embedded capability handshake as unsupported.
 *
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPCapabilityTimeout() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (getState()['features/pip']?.embeddedDocumentPiPCapability
                !== EmbeddedDocumentPiPCapability.UNKNOWN) {
            return;
        }

        logger.info('Embedded Document PiP capability handshake timed out; enabling legacy fallback');
        dispatch(handleEmbeddedDocumentPiPCapability(false));
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

        if (isAudioMuteButtonDisabled(state)
                || state['features/base/media'].audio.gumPending !== IGUMPendingState.NONE) {
            logger.debug('Ignoring PiP audio toggle while the control is unavailable');

            return;
        }

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

        if (isVideoMuteButtonDisabled(state)
                || state['features/base/media'].video.gumPending !== IGUMPendingState.NONE) {
            logger.debug('Ignoring PiP video toggle while the control is unavailable');

            return;
        }

        // Use the exact same action as toolbar button (showUI=true, ensureTrack=true).
        dispatch(handleToggleVideoMuted(!videoMuted, true, true));
    };
}

/**
 * Action to exit Picture-in-Picture mode.
 * Handles both Document PiP and Video PiP.
 *
 * @returns {Function}
 */
export function exitPiP() {
    return (dispatch: IStore['dispatch']) => {
        logger.debug('exitPiP called');

        closeDocumentPiPWindow();

        if (isEmbedded()) {
            APP.API.notifyDocumentPiPClose();
            clearEmbeddedDocumentPiPRequestTimer();
            dispatch(setEmbeddedDocumentPiPLifecycle(EmbeddedDocumentPiPLifecycle.IDLE));
            dispatch(setEmbeddedDocumentPiPRendererReady(false));
        }

        const webKitPiPVideo = document.getElementById('pipVideo') as IWebKitPictureInPictureVideoElement | null;

        if (webKitPiPVideo?.webkitPresentationMode === 'picture-in-picture'
                && typeof webKitPiPVideo.webkitSetPresentationMode === 'function') {
            try {
                webKitPiPVideo.webkitSetPresentationMode('inline');
            } catch (error) {
                logger.error('Error while exiting WebKit PiP:', error);
            }
        } else if (document.pictureInPictureElement) {
            document.exitPictureInPicture()
                .then(() => {
                    logger.debug('Exited Picture-in-Picture mode');
                })
                .catch((err: Error) => {
                    logger.error(`Error while exiting PiP: ${err.message}`);
                });
        }

        if (!isEmbedded()) {
            dispatch(setPiPActive(false));
        }
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
            enterVideoPiP(videoElement);
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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;
        const _shouldShowPip = shouldShowPiP(state);

        logger.debug(`showPiP called, shouldShow=${_shouldShowPip}, isPiPActive=${isPiPActive}`);

        if (!_shouldShowPip) {
            return;
        }

        if (!isPiPActive) {
            if ((isEmbedded() && isEmbeddedDocumentPiPAvailable(state))
                    || (!isEmbedded() && isDocumentPiPSupported())) {
                dispatch(openDocumentPiP());
            } else {
                const videoElement = document.getElementById('pipVideo') as HTMLVideoElement;

                if (!videoElement) {
                    logger.warn('showPiP: pipVideo element not found');

                    return;
                }

                enterVideoPiP(videoElement);
            }
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
 * Toggles PiP based on the current state and browser support.
 *
 * @returns {Function}
 */
export function togglePip() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;
        const _shouldShowPip = shouldShowPiP(state);

        logger.debug(`togglePip called, shouldShow=${_shouldShowPip}, isPiPActive=${isPiPActive}`);

        if (!_shouldShowPip) {
            return;
        }

        if (isPiPActive) {
            dispatch(exitPiP());

            return;
        }

        if (isDocumentPiPSupported()) {
            dispatch(openDocumentPiP({ notifyOnFailure: true }));
        } else {
            const videoElement = document.getElementById('pipVideo') as HTMLVideoElement;

            if (videoElement) {
                enterVideoPiP(videoElement);
            }
        }
    };
}

/**
 * Opens Document PiP from the toolbar or an automatic MediaSession request.
 *
 * @param {IOpenDocumentPiPOptions} options - Options controlling user-facing failure handling.
 * @returns {Function}
 */
export function openDocumentPiP(options: IOpenDocumentPiPOptions = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const _shouldShowPip = shouldShowPiP(state);
        const pipConfig = state['features/base/config']?.pip;
        const docPiPConfig = pipConfig?.documentPiP?.windowOptions;

        if (!_shouldShowPip) {
            return;
        }

        if (isEmbedded()) {
            if (!shouldShowPiP(state) || !isEmbeddedDocumentPiPAvailable(state)) {
                return;
            }

            if (state['features/pip']?.embeddedDocumentPiPLifecycle
                    === EmbeddedDocumentPiPLifecycle.REQUESTING) {
                logger.debug('Embedded Document PiP request already pending, skipping duplicate request');

                return;
            }

            clearEmbeddedDocumentPiPRequestTimer();
            dispatch(setEmbeddedDocumentPiPRendererReady(false));
            dispatch(setEmbeddedDocumentPiPLifecycle(EmbeddedDocumentPiPLifecycle.REQUESTING));

            APP.API.notifyDocumentPiPRequested({
                options: {
                    width: docPiPConfig?.width ?? DEFAULT_DOCUMENT_PIP_WIDTH,
                    height: docPiPConfig?.height ?? DEFAULT_DOCUMENT_PIP_HEIGHT,
                    disallowReturnToOpener: docPiPConfig?.disallowReturnToOpener ?? false,
                    preferInitialWindowPlacement: docPiPConfig?.preferInitialWindowPlacement ?? false,
                },
            });

            embeddedDocumentPiPRequestTimer = window.setTimeout(() => {
                embeddedDocumentPiPRequestTimer = undefined;

                if (getState()['features/pip']?.embeddedDocumentPiPLifecycle
                        === EmbeddedDocumentPiPLifecycle.REQUESTING) {
                    logger.warn('Embedded Document PiP request timed out');
                    dispatch(setEmbeddedDocumentPiPLifecycle(
                        getState()['features/pip']?.embeddedDocumentPiPCapability
                                === EmbeddedDocumentPiPCapability.AVAILABLE
                            ? EmbeddedDocumentPiPLifecycle.IDLE
                            : EmbeddedDocumentPiPLifecycle.UNAVAILABLE));
                    dispatch(setEmbeddedDocumentPiPRendererReady(false));
                }
            }, EMBEDDED_DOCUMENT_PIP_REQUEST_TIMEOUT);

            return;
        }

        const docPiP = window.documentPictureInPicture;

        if (!isDocumentPiPSupported() || !docPiP) {
            logger.warn('Document Picture-in-Picture not supported');

            return;
        }

        const docPiPWindow = docPiP.window;
        const storedWindow = getStoredPiPWindow();

        // Two sources can diverge: storedWindow is the window this feature opened and initialized, while
        // docPiP.window is the browser's view of any Document PiP window open for this page. Only one Document PiP
        // window may exist per page and requestWindow() closes an existing one, so do not open if either is active.
        const isPiPWindowAlreadyOpen = Boolean(
            (storedWindow && !storedWindow.closed) || (docPiPWindow && !docPiPWindow.closed));

        if (isPiPWindowAlreadyOpen) {
            logger.debug('Document PiP is already open');

            return;
        }

        if (storedWindow?.closed) {
            closeDocumentPiPWindow();
        }

        if (isDocumentPiPRequestPending()) {
            logger.debug('Document PiP request already pending, skipping duplicate request');

            return;
        }

        setDocumentPiPRequestPending(true);

        const handleError = (error: unknown) => {
            logger.error('Failed to open Document PiP:', error);
            dispatch(setPiPActive(false));

            if (options.notifyOnFailure) {
                dispatch(showErrorNotification({
                    descriptionKey: 'notify.pipOpenFailedDescription',
                    titleKey: 'notify.pipOpenFailedTitle'
                }));
            }
        };

        try {
            return docPiP.requestWindow({
                width: docPiPConfig?.width ?? DEFAULT_DOCUMENT_PIP_WIDTH,
                height: docPiPConfig?.height ?? DEFAULT_DOCUMENT_PIP_HEIGHT,
                disallowReturnToOpener: docPiPConfig?.disallowReturnToOpener ?? false,
                preferInitialWindowPlacement: docPiPConfig?.preferInitialWindowPlacement ?? false,
            })
                .then((pipWindow: Window) => {
                    if (pipWindow.closed) {
                        clearPiPWindow();
                        dispatch(setPiPActive(false));

                        return;
                    }

                    pipWindow.addEventListener('pagehide', () => {
                        clearPiPWindow();
                        dispatch(handlePiPLeaveEvent());
                    });

                    initPiPWindow(pipWindow);
                    dispatch(handlePipEnterEvent());
                })
                .catch(handleError)
                .finally(() => {
                    setDocumentPiPRequestPending(false);
                });
        } catch (error) {
            setDocumentPiPRequestPending(false);
            handleError(error);
        }
    };
}

export function handleEmbeddedDocumentPiPOpened() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        clearEmbeddedDocumentPiPRequestTimer();
        logger.info('Embedded Document PiP renderer handshake completed');

        if (!shouldShowPiP(state) || !isEmbeddedDocumentPiPAvailable(state)) {
            APP.API.notifyDocumentPiPClose();
            dispatch(setEmbeddedDocumentPiPRendererReady(false));
            dispatch(setEmbeddedDocumentPiPLifecycle(
                state['features/pip']?.embeddedDocumentPiPCapability
                        === EmbeddedDocumentPiPCapability.AVAILABLE
                    ? EmbeddedDocumentPiPLifecycle.IDLE
                    : EmbeddedDocumentPiPLifecycle.UNAVAILABLE));

            return;
        }

        dispatch(setEmbeddedDocumentPiPLifecycle(EmbeddedDocumentPiPLifecycle.ACTIVE));
        dispatch(setEmbeddedDocumentPiPRendererReady(true));
        APP.API.notifyPictureInPictureEntered();
    };
}

export function handleEmbeddedDocumentPiPOpenFailed(error?: { reason?: string; }) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        clearEmbeddedDocumentPiPRequestTimer();
        logger.warn('Embedded Document PiP open failed:', error?.reason);
        dispatch(setEmbeddedDocumentPiPRendererReady(false));
        dispatch(setEmbeddedDocumentPiPLifecycle(
            getState()['features/pip']?.embeddedDocumentPiPCapability
                    === EmbeddedDocumentPiPCapability.AVAILABLE
                ? EmbeddedDocumentPiPLifecycle.IDLE
                : EmbeddedDocumentPiPLifecycle.UNAVAILABLE));
    };
}

export function handleEmbeddedDocumentPiPWindowClosed() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        clearEmbeddedDocumentPiPRequestTimer();
        dispatch(setEmbeddedDocumentPiPRendererReady(false));
        dispatch(setEmbeddedDocumentPiPLifecycle(
            getState()['features/pip']?.embeddedDocumentPiPCapability
                    === EmbeddedDocumentPiPCapability.AVAILABLE
                ? EmbeddedDocumentPiPLifecycle.IDLE
                : EmbeddedDocumentPiPLifecycle.UNAVAILABLE));
        APP.API.notifyPictureInPictureLeft();
    };
}

export function handleEmbeddedDocumentPiPCommand(command: string) {
    return (dispatch: IStore['dispatch']) => {
        switch (command) {
        case 'toggle-audio':
            dispatch(toggleAudioFromPiP());
            break;
        case 'toggle-video':
            dispatch(toggleVideoFromPiP());
            break;
        case 'hangup':
            dispatch(leaveConference());
            break;
        }
    };
}

export function handleEmbeddedDocumentPiPReconnect(state?: { generation?: number; }) {
    return {
        type: EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED,
        generation: state?.generation
    };
}

export function handleEmbeddedDocumentPiPConnectionStateChanged(state: {
    connectionState?: string;
    error?: string;
    generation?: number;
    iceConnectionState?: string;
}) {
    return {
        type: EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED,
        state
    };
}

export function handleEmbeddedDocumentPiPAnswerReceived(data: {
    answer: RTCSessionDescriptionInit;
    generation: number;
}) {
    return {
        type: EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED,
        data
    };
}

export function handleEmbeddedDocumentPiPIceReceived(data: {
    candidate: RTCIceCandidateInit;
    generation: number;
}) {
    return {
        type: EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED,
        data
    };
}
