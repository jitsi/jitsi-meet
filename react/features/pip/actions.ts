import { IStore } from '../app/types';
import { browser } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import type { MediaCastSignal } from '../base/media-cast/types.web';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { isEmbedded } from '../base/util/embedUtils';
import { showErrorNotification } from '../notifications/actions';
import { handleToggleVideoMuted } from '../toolbox/actions.any';
import { muteLocal } from '../video-menu/actions.any';

import {
    HOST_DOCUMENT_PIP_CLOSED,
    HOST_DOCUMENT_PIP_OPENED,
    HOST_DOCUMENT_PIP_SIGNAL_RECEIVED,
    SET_PIP_ACTIVE,
    SET_PIP_DISMISSED,
    SET_PIP_WINDOW,
    SET_PIP_WINDOW_MODE_UNSUPPORTED
} from './actionTypes';
import {
    DEFAULT_DOCUMENT_PIP_HEIGHT,
    DEFAULT_DOCUMENT_PIP_WIDTH,
    DEFAULT_ELECTRON_PIP_HEIGHT,
    DEFAULT_ELECTRON_PIP_WIDTH,
    ELECTRON_PIP_DENIAL_GRACE_MS,
    ELECTRON_PIP_WINDOW_NAME
} from './constants';
import {
    cleanupMediaSessionHandlers,
    enterVideoPiP,
    getPiPMode,
    initPiPWindow,
    isDocumentPiPRequestPending,
    isElectronPiPWindowMode,
    setDocumentPiPRequestPending,
    setupMediaSessionHandlers,
    shouldShowPiP,
    shouldUseDocumentPiP
} from './functions';
import logger from './logger';
import type { IOpenDocumentPiPOptions, IWebKitPictureInPictureVideoElement, PiPLeaveReason } from './types';

/**
 * Whether the current host-owned request should notify the user if opening fails.
 */
let hostDocumentPiPNotifyOnFailure = false;

/**
 * Clears the pending host-owned PiP request state.
 *
 * @returns {void}
 */
export function clearHostDocumentPiPPendingState() {
    hostDocumentPiPNotifyOnFailure = false;
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
 * Action to set whether the user dismissed PiP for the rest of the conference
 * (by closing the custom Electron PiP window).
 *
 * @param {boolean} dismissed - Whether PiP is dismissed.
 * @returns {{
 *     type: SET_PIP_DISMISSED,
 *     dismissed: boolean
 * }}
 */
export function setPiPDismissed(dismissed: boolean) {
    return {
        type: SET_PIP_DISMISSED,
        dismissed
    };
}

/**
 * Action recording that the embedding Electron app denied the custom PiP
 * window popup, so the video-element PiP is used for the rest of the session.
 *
 * @param {boolean} unsupported - Whether the window mode is unsupported.
 * @returns {{
 *     type: SET_PIP_WINDOW_MODE_UNSUPPORTED,
 *     unsupported: boolean
 * }}
 */
export function setPiPWindowModeUnsupported(unsupported: boolean) {
    return {
        type: SET_PIP_WINDOW_MODE_UNSUPPORTED,
        unsupported
    };
}

/**
 * Opens the custom Electron PiP window: a same-origin popup opened from
 * inside the meeting iframe, which the Electron SDK's main process turns into
 * a small frameless always-on-top window (the legacy always-on-top
 * experience). The window content is rendered by the meeting through a React
 * portal (see ElectronPiPWindow).
 *
 * @returns {Function}
 */
export function openElectronPiPWindow() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (!shouldShowPiP(state) || !isElectronPiPWindowMode(state)) {
            return;
        }

        const { dismissed, isPiPActive, pipWindow } = state['features/pip'];

        if (isPiPActive || dismissed || (pipWindow && !pipWindow.closed)) {
            return;
        }

        logger.debug('Opening the Electron PiP window');

        const newPiPWindow = window.open(
            '',
            ELECTRON_PIP_WINDOW_NAME,
            `width=${DEFAULT_ELECTRON_PIP_WIDTH},height=${DEFAULT_ELECTRON_PIP_HEIGHT}`);

        if (!newPiPWindow) {
            dispatch(handleElectronPiPWindowUnsupported());

            return;
        }

        const openedAt = Date.now();

        initPiPWindow(newPiPWindow);

        newPiPWindow.addEventListener('pagehide', () => {
            // exitPiP() clears the stored reference before closing the window,
            // so a still-matching reference means the close was not initiated
            // by us: either the embedding app denied/killed the popup right
            // away (no SDK support - fall back to video PiP), or the user
            // closed it through the OS (dismiss for the rest of the meeting;
            // the in-window X button posts the dismissal itself).
            if (getState()['features/pip'].pipWindow !== newPiPWindow) {
                return;
            }

            dispatch(setPiPWindow(null));

            if (Date.now() - openedAt < ELECTRON_PIP_DENIAL_GRACE_MS) {
                dispatch(setPiPActive(false));
                cleanupMediaSessionHandlers();
                dispatch(handleElectronPiPWindowUnsupported());

                return;
            }

            dispatch(setPiPDismissed(true));
            dispatch(handlePiPLeaveEvent('dismissed'));
        });

        dispatch(setPiPWindow(newPiPWindow));
        dispatch(handlePipEnterEvent());

        // Backstop for embedding apps that deny the popup without firing
        // pagehide on the returned stub: detect the dead window and fall back.
        setTimeout(() => {
            if (getState()['features/pip'].pipWindow === newPiPWindow && newPiPWindow.closed) {
                dispatch(setPiPWindow(null));
                dispatch(setPiPActive(false));
                cleanupMediaSessionHandlers();
                dispatch(handleElectronPiPWindowUnsupported());
            }
        }, ELECTRON_PIP_DENIAL_GRACE_MS);
    };
}

/**
 * Handles the embedding Electron app being unable to create the custom PiP
 * window: remembers the failure and lets the video-element PiP take over for
 * the rest of the session (the PiP video element re-enters PiP on mount when
 * the window is still unfocused).
 *
 * @returns {Function}
 */
export function handleElectronPiPWindowUnsupported() {
    return (dispatch: IStore['dispatch']) => {
        logger.warn('The embedding app cannot create the PiP window; falling back to video-element PiP');

        dispatch(setPiPWindowModeUnsupported(true));
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
 * @param {PiPLeaveReason} reason - Why PiP is left; reported to embedding apps with pipLeft.
 * @returns {Function}
 */
export function exitPiP(reason: PiPLeaveReason = 'requested') {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        logger.debug(`exitPiP called (${reason})`);
        clearHostDocumentPiPPendingState();

        const wasActive = getState()['features/pip']?.isPiPActive;
        const { pipWindow } = getState()['features/pip'];

        if (pipWindow) {
            // Clear the reference before close() so the window's pagehide listener runs against
            // the already-cleared state, mirroring the browser-initiated close flow.
            dispatch(setPiPWindow(null));

            if (!pipWindow.closed) {
                pipWindow.close();
            }

            // On Electron the stored window is the custom PiP popup, whose pagehide handler
            // reports only closes it does not own; a programmatic close finishes the leave
            // flow here (the Document PiP window's own pagehide handler does this in browsers).
            if (browser.isElectron()) {
                if (wasActive) {
                    dispatch(handlePiPLeaveEvent(reason));
                }

                return;
            }
        }

        if (isEmbedded() && shouldUseDocumentPiP(getState())) {
            setDocumentPiPRequestPending(false);
            APP.API.notifyDocumentPiPClose();

            // hidePiP() may run while the host has not answered yet, in which case PiP never
            // opened and emitting pipLeft without a matching pipEntered would be unbalanced.
            if (wasActive) {
                dispatch(handlePiPLeaveEvent(reason));
            }

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
            dispatch(exitPiP('focus'));
        }
    };
}

/**
 * Action to handle leaving Picture-in-Picture (the browser's leavepictureinpicture event, the
 * Document PiP window closing or the custom Electron PiP window closing).
 * Updates state, cleans up MediaSession handlers and reports the leave to embedding apps.
 *
 * @param {PiPLeaveReason} [reason] - Why PiP was left, when known.
 * @returns {Function}
 */
export function handlePiPLeaveEvent(reason?: PiPLeaveReason) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mode = getPiPMode(getState());

        logger.log(`Left Picture-in-Picture mode (mode: ${mode}, reason: ${reason})`);

        dispatch(setPiPActive(false));
        cleanupMediaSessionHandlers();
        APP.API.notifyPictureInPictureLeft(mode, reason);
    };
}

/**
 * Action to handle entering Picture-in-Picture (the browser's enterpictureinpicture event, the
 * Document PiP window opening or the custom Electron PiP window opening).
 * Updates state, sets up MediaSession handlers and reports the active implementation to
 * embedding apps.
 *
 * @returns {Function}
 */
export function handlePipEnterEvent() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mode = getPiPMode(getState());

        logger.log(`Entered Picture-in-Picture mode (mode: ${mode})`);

        dispatch(setPiPActive(true));
        setupMediaSessionHandlers(dispatch);
        APP.API.notifyPictureInPictureEntered(mode);
    };
}

/**
 * Reports that the user double clicked the custom Electron PiP window (the legacy always-on-top
 * gesture, meaning "return to the meeting"). Embedding apps and the Electron SDK focus the window
 * hosting the meeting; the resulting focus then closes the PiP window like any refocus.
 *
 * @returns {Function}
 */
export function handlePiPDoubleClick() {
    return (_dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mode = getPiPMode(getState());

        logger.log('Picture-in-Picture window double clicked');
        APP.API.notifyPictureInPictureDoubleClicked(mode);
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
            if (isElectronPiPWindowMode(state)) {
                dispatch(openElectronPiPWindow());
            } else if (shouldUseDocumentPiP(state)) {
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
        clearHostDocumentPiPPendingState();

        const state = getState();
        const isPiPActive = state['features/pip']?.isPiPActive;
        const embeddedRequestPending = isEmbedded()
            && shouldUseDocumentPiP(state)
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

        if (isElectronPiPWindowMode(state)) {
            // An explicit toggle overrides an earlier dismissal of the window.
            dispatch(setPiPDismissed(false));
            dispatch(openElectronPiPWindow());
        } else if (shouldUseDocumentPiP(state)) {
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

        // Electron never asks the host for a Document PiP window; browsers without the Document PiP
        // API, or with config.pip.mode requesting the video-element PiP, use the Video PiP element.
        if (!shouldUseDocumentPiP(state)) {
            logger.warn('Document Picture-in-Picture not supported');

            return;
        }

        if (isEmbedded()) {
            if (state['features/pip']?.isPiPActive || isDocumentPiPRequestPending()) {
                return;
            }

            setDocumentPiPRequestPending(true);
            hostDocumentPiPNotifyOnFailure = Boolean(options.notifyOnFailure);
            APP.API.notifyDocumentPiPRequested();

            return;
        }

        const docPiP = window.documentPictureInPicture;

        if (!docPiP) {
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
 * Applies the host acknowledgement once the parent-owned document and the dedicated Document PiP
 * renderer bundle are ready, and signals the sender to start streaming.
 *
 * @returns {Function}
 */
export function handleHostDocumentPiPOpened() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        clearHostDocumentPiPPendingState();
        setDocumentPiPRequestPending(false);

        const state = getState();

        if (!shouldShowPiP(state)) {
            APP.API.notifyDocumentPiPClose();

            return;
        }

        if (!state['features/pip']?.isPiPActive) {
            dispatch(handlePipEnterEvent());
        }

        dispatch({ type: HOST_DOCUMENT_PIP_OPENED });
    };
}

/**
 * Clears the request guard after the host rejects requestWindow or resource setup.
 *
 * @returns {Function}
 */
export function handleHostDocumentPiPOpenFailed() {
    return (dispatch: IStore['dispatch']) => {
        const notifyOnFailure = hostDocumentPiPNotifyOnFailure;

        logger.warn('Embedded Document PiP open failed.');
        clearHostDocumentPiPPendingState();
        setDocumentPiPRequestPending(false);
        dispatch({ type: HOST_DOCUMENT_PIP_CLOSED });

        if (notifyOnFailure) {
            dispatch(showErrorNotification({
                descriptionKey: 'notify.pipOpenFailedDescription',
                titleKey: 'notify.pipOpenFailedTitle'
            }));
        }
    };
}

/**
 * Handles the authoritative close acknowledgement from the embedding page.
 *
 * @returns {Function}
 */
export function handleHostDocumentPiPWindowClosed() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const wasActive = getState()['features/pip']?.isPiPActive;

        clearHostDocumentPiPPendingState();
        setDocumentPiPRequestPending(false);
        dispatch({ type: HOST_DOCUMENT_PIP_CLOSED });

        if (wasActive) {
            dispatch(handlePiPLeaveEvent());
        }
    };
}

/**
 * Carries the one internal signaling union into the ordered sender queue.
 *
 * @param {MediaCastSignal} signal - WebRTC signal from the embedding page.
 * @returns {Object}
 */
export function handleHostDocumentPiPSignal(signal: MediaCastSignal) {
    return {
        type: HOST_DOCUMENT_PIP_SIGNAL_RECEIVED,
        signal
    };
}
