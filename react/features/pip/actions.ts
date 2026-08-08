import { IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { isEmbedded } from '../base/util/embedUtils';
import { showErrorNotification } from '../notifications/actions';
import { handleToggleVideoMuted } from '../toolbox/actions.any';
import { muteLocal } from '../video-menu/actions.any';

import {
    SET_PIP_ACTIVE,
    SET_PIP_WINDOW,
} from './actionTypes';
import { DEFAULT_DOCUMENT_PIP_HEIGHT, DEFAULT_DOCUMENT_PIP_WIDTH } from './constants';
import {
    cleanupMediaSessionHandlers,
    enterVideoPiP,
    initPiPWindow,
    isDocumentPiPRequestPending,
    isDocumentPiPSupported,
    setDocumentPiPRequestPending,
    setupMediaSessionHandlers,
    shouldShowPiP,
} from './functions';
import logger from './logger';
import type { IOpenDocumentPiPOptions, IWebKitPictureInPictureVideoElement } from './types';

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
 * Stores the host capability result. Undefined is deliberately represented by
 * the absence of this action so the old-host timeout remains derived state.
 *
 * @param {boolean} available - Whether the embedding page can own Document PiP.
 * @returns {Object}
 */
export function setEmbeddedDocumentPiPAvailable(available: boolean) {
    return {
        type: SET_EMBEDDED_DOCUMENT_PIP_AVAILABLE,
        available
    };
}

/**
 * Applies a capability response from the embedding page.
 *
 * @param {boolean} available - Whether host-owned Document PiP is available.
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPCapability(available: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const pipState = getState()['features/pip'];
        const wasHostDocumentPiPActive
            = pipState?.embeddedDocumentPiPAvailable === true && pipState.isPiPActive;
        const requestPending = isDocumentPiPRequestPending();

        dispatch(setEmbeddedDocumentPiPAvailable(available));

        if (!available && (wasHostDocumentPiPActive || requestPending)) {
            setDocumentPiPRequestPending(false);
            APP.API.notifyDocumentPiPClose();
        }
    };
}

/**
 * Treats an unanswered capability handshake as an old host and enables the
 * existing Video PiP fallback.
 *
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPCapabilityTimeout() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (getState()['features/pip']?.embeddedDocumentPiPAvailable === undefined) {
            logger.info('Embedded Document PiP capability handshake timed out; using Video PiP');
            dispatch(setEmbeddedDocumentPiPAvailable(false));
        }
    };
}

/**
 * Action to store the Document PiP window reference.
 *
 * @param {Window|null} pipWindow - The open Document PiP window, or null when none is open.
 * @returns {{
 *     type: SET_PIP_WINDOW,
 *     pipWindow: (Window|null)
 * }}
 */
export function setPiPWindow(pipWindow: Window | null) {
    return {
        type: SET_PIP_WINDOW,
        pipWindow
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
 * Action to exit Picture-in-Picture mode.
 * Handles both Document PiP and Video PiP.
 *
 * @returns {Function}
 */
export function exitPiP() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        logger.debug('exitPiP called');

        const { pipWindow } = getState()['features/pip'];

        if (pipWindow) {
            // Clear the reference before close() so the window's pagehide listener runs against
            // the already-cleared state, mirroring the browser-initiated close flow.
            dispatch(setPiPWindow(null));

            if (!pipWindow.closed) {
                pipWindow.close();
            }
        }

        if (isEmbedded() && getState()['features/pip']?.embeddedDocumentPiPAvailable === true) {
            setDocumentPiPRequestPending(false);
            APP.API.notifyDocumentPiPClose();

            return;
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
            if ((isEmbedded() && state['features/pip']?.embeddedDocumentPiPAvailable === true)
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
        const embeddedRequestPending = isEmbedded()
            && state['features/pip']?.embeddedDocumentPiPAvailable === true
            && isDocumentPiPRequestPending();

        logger.debug(`hidePiP called, isPiPActive=${isPiPActive}`);

        if (isPiPActive || embeddedRequestPending) {
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

        if ((isEmbedded() && state['features/pip']?.embeddedDocumentPiPAvailable === true)
                || (!isEmbedded() && isDocumentPiPSupported())) {
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
 * Embedded meetings only request the host-owned window; the host config is the
 * single source of truth for window options.
 *
 * @param {IOpenDocumentPiPOptions} options - Options controlling user-facing failure handling.
 * @returns {Function}
 */
export function openDocumentPiP(options: IOpenDocumentPiPOptions = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const _shouldShowPip = shouldShowPiP(state);

        if (!_shouldShowPip) {
            return;
        }

        if (isEmbedded()) {
            if (state['features/pip']?.embeddedDocumentPiPAvailable !== true
                    || state['features/pip']?.isPiPActive
                    || isDocumentPiPRequestPending()) {
                return;
            }

            setDocumentPiPRequestPending(true);
            APP.API.notifyDocumentPiPRequested();

            return;
        }

        const docPiP = window.documentPictureInPicture;

        if (!isDocumentPiPSupported() || !docPiP) {
            logger.warn('Document Picture-in-Picture not supported');

            return;
        }

        const pipConfig = state['features/base/config']?.pip;
        const docPiPConfig = pipConfig?.documentPiP?.windowOptions;
        const docPiPWindow = docPiP.window;
        const storedWindow = state['features/pip'].pipWindow;

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
            dispatch(setPiPWindow(null));
        }

        if (isDocumentPiPRequestPending()) {
            logger.debug('Document PiP request already pending, skipping duplicate request');

            return;
        }

        setDocumentPiPRequestPending(true);

        const handleError = (error: unknown) => {
            logger.error('Failed to open Document PiP:', error);

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
                    // The window can be closed before this resolves; nothing has been stored or
                    // dispatched for it yet, so simply do not initialize it.
                    if (pipWindow.closed) {
                        return;
                    }

                    pipWindow.addEventListener('pagehide', () => {
                        dispatch(setPiPWindow(null));
                        dispatch(handlePiPLeaveEvent());
                    });

                    initPiPWindow(pipWindow);
                    dispatch(setPiPWindow(pipWindow));
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

/**
 * Applies the host acknowledgement only after the parent-owned document and
 * reused Always-on-Top bundle are ready.
 *
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPOpened() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        setDocumentPiPRequestPending(false);

        const state = getState();

        if (!shouldShowPiP(state) || state['features/pip']?.embeddedDocumentPiPAvailable !== true) {
            APP.API.notifyDocumentPiPClose();

            return;
        }

        if (!state['features/pip']?.isPiPActive) {
            dispatch(handlePipEnterEvent());
        }
    };
}

/**
 * Clears the request guard after the host rejects requestWindow or resource setup.
 *
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPOpenFailed() {
    return () => {
        logger.warn('Embedded Document PiP open failed.');
        setDocumentPiPRequestPending(false);
    };
}

/**
 * Handles the authoritative close acknowledgement from the embedding page.
 *
 * @returns {Function}
 */
export function handleEmbeddedDocumentPiPWindowClosed() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const wasActive = getState()['features/pip']?.isPiPActive;

        setDocumentPiPRequestPending(false);
        if (wasActive) {
            dispatch(handlePiPLeaveEvent());
        }
    };
}

/**
 * Carries the one internal signaling union into the ordered sender queue.
 *
 * @param {DocumentPiPSignal} signal - WebRTC signal from the embedding page.
 * @returns {Object}
 */
export function handleEmbeddedDocumentPiPSignal(signal: DocumentPiPSignal) {
    return {
        type: EMBEDDED_DOCUMENT_PIP_SIGNAL_RECEIVED,
        signal
    };
}
