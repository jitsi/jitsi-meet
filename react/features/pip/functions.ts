import { IReduxState, IStore } from '../app/types';
import { AVATAR_DEFAULT_BACKGROUND_COLOR } from '../base/avatar/components/web/styles';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { leaveConference } from '../base/conference/actions';
import { browser } from '../base/lib-jitsi-meet';
import { IParticipant } from '../base/participants/types';
import { getLocalVideoTrack } from '../base/tracks/functions.any';
import { getVideoTrackByParticipant } from '../base/tracks/functions.web';
import { ITrack } from '../base/tracks/types';
import { isTrackStreamingStatusActive } from '../connection-indicator/functions';
import { isPrejoinPageVisible } from '../prejoin/functions.any';

import { toggleAudioFromPiP, toggleVideoFromPiP } from './actions';
import { isPiPEnabled } from './external-api.shared';
import logger from './logger';
import {
    ExtendedMediaSessionAction,
    ExtendedMediaSessionActionHandler,
    IMediaSessionState
} from './types';

/**
 * Flag to track if a PiP request is currently pending (requested but not yet entered).
 *
 * This prevents duplicate PiP entry requests that can occur on macOS when minimizing
 * a window. On minimize, both the 'blur' event and 'visibilitychange' event fire in
 * rapid succession (within ~10ms), each triggering enterVideoPiP(). Without this guard,
 * Electron receives two PiP requests before the first one completes, causing the
 * first PiP to immediately exit and triggering a pip leave event that will cause the window to be restored.
 */
let pipRequestPending = false;

/**
 * Flag to track if a Document PiP request is currently pending.
 * Prevents duplicate requestWindow() calls before the first one resolves.
 */
let docPiPRequestPending = false;

/**
 * Returns whether a Document PiP request is currently pending.
 *
 * @returns {boolean}
 */
export function isDocumentPiPRequestPending() {
    return docPiPRequestPending;
}

/**
 * Updates the pending state of the Document PiP request.
 *
 * @param {boolean} pending - Whether a Document PiP request is pending.
 * @returns {void}
 */
export function setDocumentPiPRequestPending(pending: boolean) {
    docPiPRequestPending = pending;
}

/**
 * Gets the appropriate video track for PiP based on prejoin state.
 * During prejoin, returns local video track. In conference, returns large video participant's track.
 *
 * @param {IReduxState} state - Redux state.
 * @param {IParticipant | undefined} participant - Participant to get track for.
 * @returns {ITrack | undefined} The video track or undefined.
 */
export function getPiPVideoTrack(state: IReduxState, participant: IParticipant | undefined) {
    const isOnPrejoin = isPrejoinPageVisible(state);

    return isOnPrejoin
        ? getLocalVideoTrack(state['features/base/tracks'])
        : getVideoTrackByParticipant(state, participant);
}

/**
 * Returns whether PiP should show an avatar instead of the selected video track.
 *
 * @param {ITrack | undefined} videoTrack - The selected PiP video track.
 * @returns {boolean} Whether the avatar should be shown.
 */
export function shouldShowPiPAvatar(videoTrack: ITrack | undefined): boolean {
    return !videoTrack
        || videoTrack.muted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));
}

/**
 * Determines if PiP should be shown based on config and current app state.
 * Checks if PiP is enabled and handles prejoin page visibility.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {boolean} Whether PiP should be shown.
 */
export function shouldShowPiP(state: IReduxState): boolean {
    const pipConfig = state['features/base/config'].pip;

    // Covers the global kill switch (disabled), an explicit enableBrowserPiP: false and browser
    // API support.
    if (!isPiPEnabled(pipConfig)) {
        return false;
    }

    // Browser PiP is opt-in: it stays disabled unless the deployment explicitly sets
    // enableBrowserPiP: true (Electron is unaffected). This authoritative default lives here
    // rather than in isPiPEnabled() because the external API evaluates isPiPEnabled() against
    // only the embedder-provided config, without the deployment's config.js — it must stay
    // permissive when the flag is absent (see isPiPEnabled()).
    if (!browser.isElectron() && pipConfig?.enableBrowserPiP !== true) {
        return false;
    }

    // Check prejoin state.
    const isOnPrejoin = isPrejoinPageVisible(state);
    const showOnPrejoin = pipConfig?.showOnPrejoin ?? false;

    // Don't show PiP on prejoin unless explicitly enabled.
    if (isOnPrejoin && !showOnPrejoin) {
        return false;
    }

    return true;
}

/**
 * Draws an image-based avatar as a circular clipped image on canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {string} imageUrl - URL of the avatar image.
 * @param {boolean | undefined} useCORS - Whether to use CORS for image loading.
 * @param {number} centerX - X coordinate of avatar center.
 * @param {number} centerY - Y coordinate of avatar center.
 * @param {number} radius - Radius of the avatar circle.
 * @returns {Promise<void>}
 */
export async function drawImageAvatar(
        ctx: CanvasRenderingContext2D,
        imageUrl: string,
        useCORS: boolean | undefined,
        centerX: number,
        centerY: number,
        radius: number
): Promise<void> {
    const img = new Image();

    if (useCORS) {
        img.crossOrigin = 'anonymous';
    }
    img.src = imageUrl;

    try {
        await img.decode();
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
        const size = radius * 2;

        ctx.drawImage(img, centerX - radius, centerY - radius, size, size);
        ctx.restore();
    } catch (error) {
        logger.error('Failed to draw image avatar', error);
        throw new Error('Image load failed');
    }
}

/**
 * Draws an initials-based avatar with a colored background on canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {string} name - Participant's display name.
 * @param {Array<string>} customAvatarBackgrounds - Custom avatar background colors.
 * @param {number} centerX - X coordinate of avatar center.
 * @param {number} centerY - Y coordinate of avatar center.
 * @param {number} radius - Radius of the avatar circle.
 * @param {string} fontFamily - Font family to use for initials.
 * @param {string} textColor - Color for the initials text.
 * @returns {void}
 */
export function drawInitialsAvatar(
        ctx: CanvasRenderingContext2D,
        name: string,
        customAvatarBackgrounds: Array<string>,
        centerX: number,
        centerY: number,
        radius: number,
        fontFamily: string,
        textColor: string
) {
    const initials = getInitials(name);
    const color = getAvatarColor(name, customAvatarBackgrounds);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `bold 80px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, centerX, centerY);
}

/**
 * Draws the default user icon when no avatar is available.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {HTMLImageElement | null} defaultIcon - Preloaded default icon image.
 * @param {number} centerX - X coordinate of icon center.
 * @param {number} centerY - Y coordinate of icon center.
 * @param {number} radius - Radius of the icon circle.
 * @returns {void}
 */
export function drawDefaultIcon(
        ctx: CanvasRenderingContext2D,
        defaultIcon: HTMLImageElement | null,
        centerX: number,
        centerY: number,
        radius: number
) {
    ctx.fillStyle = AVATAR_DEFAULT_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    if (defaultIcon) {
        const iconSize = radius;
        const x = centerX - iconSize / 2;
        const y = centerY - iconSize / 2;

        ctx.drawImage(defaultIcon, x, y, iconSize, iconSize);
    }
}

/**
 * Maximum character limit for display name before truncation.
 */
const DISPLAY_NAME_MAX_CHARS = 25;

/**
 * Draws the participant's display name below the avatar.
 * Truncates long names with ellipsis using a simple character limit.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {string} displayName - Participant's display name.
 * @param {number} centerX - X coordinate of text center.
 * @param {number} y - Y coordinate of text top.
 * @param {string} fontFamily - Font family to use for display name.
 * @param {string} textColor - Color for the display name text.
 * @returns {void}
 */
export function drawDisplayName(
        ctx: CanvasRenderingContext2D,
        displayName: string,
        centerX: number,
        y: number,
        fontFamily: string,
        textColor: string
) {
    const truncated = displayName.length > DISPLAY_NAME_MAX_CHARS
        ? `${displayName.slice(0, DISPLAY_NAME_MAX_CHARS)}...`
        : displayName;

    ctx.fillStyle = textColor;
    ctx.font = `24px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(truncated, centerX, y);
}

/**
 * Renders a complete avatar (image, initials, or default icon) with display name on canvas.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {IParticipant | undefined} participant - The participant to render.
 * @param {string} displayName - The display name to show.
 * @param {Array<string>} customAvatarBackgrounds - Custom avatar background colors.
 * @param {HTMLImageElement | null} defaultIcon - Preloaded default icon image.
 * @param {string} backgroundColor - Background color for the canvas.
 * @param {string} fontFamily - Font family to use for text rendering.
 * @param {string} initialsColor - Color for avatar initials text.
 * @param {string} displayNameColor - Color for display name text.
 * @returns {Promise<void>}
 */
export async function renderAvatarOnCanvas(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        participant: IParticipant | undefined,
        displayName: string,
        customAvatarBackgrounds: Array<string>,
        defaultIcon: HTMLImageElement | null,
        backgroundColor: string,
        fontFamily: string,
        initialsColor: string,
        displayNameColor: string
): Promise<void> {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const avatarRadius = 100;
    const spacing = 20;
    const textY = centerY + avatarRadius + spacing;

    // Clear and fill background.
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    let avatarRendered = false;

    if (participant?.loadableAvatarUrl) {
        try {
            await drawImageAvatar(
                ctx,
                participant.loadableAvatarUrl,
                participant.loadableAvatarUrlUseCORS,
                centerX,
                centerY,
                avatarRadius
            );
            avatarRendered = true;
        } catch (error) {
            logger.warn('Failed to load image avatar, falling back.', error);
        }
    }

    if (!avatarRendered) {
        if (participant?.name) {
            drawInitialsAvatar(
                ctx, participant.name, customAvatarBackgrounds, centerX, centerY, avatarRadius, fontFamily, initialsColor
            );
        } else {
            drawDefaultIcon(ctx, defaultIcon, centerX, centerY, avatarRadius);
        }
    }

    drawDisplayName(ctx, displayName, centerX, textY, fontFamily, displayNameColor);
}

/**
 * Requests picture-in-picture mode for the pip video element.
 *
 * NOTE: Called by Electron main process with userGesture: true.
 *
 * @returns {void}
 */
export function requestPictureInPicture() {
    const video = document.getElementById('pipVideo') as HTMLVideoElement;

    if (!video) {
        logger.error('PiP video element (#pipVideo) not found');
        pipRequestPending = false;

        return;
    }
    if (document.pictureInPictureElement) {
        logger.warn('Already in PiP mode');
        pipRequestPending = false;

        return;
    }

    // Check if video metadata is loaded.
    // readyState >= 1 (HAVE_METADATA) means video dimensions are available.
    if (video.readyState < 1) {
        logger.warn('Video metadata not loaded yet, waiting...');

        // Two known limitations of this deferred request, deliberately not handled for now:
        //
        // 1. 'loadedmetadata' may never fire (e.g. the avatar image fetch stalls forever, so the
        //    canvas captureStream(0) never produces a frame, or a video track never delivers a
        //    frame). pipRequestPending then stays true and PiP is blocked until page reload.
        //    If reports of a permanently dead PiP button ever come in, bound the wait:
        //
        //        const onMetadata = () => {
        //            clearTimeout(timer);
        //            // ...existing requestPictureInPicture() logic...
        //        };
        //        const timer = setTimeout(() => {
        //            video.removeEventListener('loadedmetadata', onMetadata);
        //            logger.warn('Timed out waiting for video metadata, resetting PiP request state.');
        //            pipRequestPending = false;
        //        }, 5000);
        //        video.addEventListener('loadedmetadata', onMetadata, { once: true });
        //
        // 2. TODO: In browsers, by the time 'loadedmetadata' fires the click's transient activation
        //    has expired, so requestPictureInPicture() below rejects with NotAllowedError and the
        //    click fails silently; clicking again once media is flowing works. This only happens
        //    when the click lands in a readyState < 1 window: the brief moment right after mount,
        //    the ~100ms srcObject swap when the large-video participant changes or the camera is
        //    toggled, or while a slow avatar image fetch delays the first canvas frame — so it is
        //    rare in practice. Revisit if it shows up in reports (e.g. a short bounded wait within
        //    the activation window). The Electron flow is unaffected: it requests PiP from the main
        //    process with userGesture: true, and its behavior here is pre-existing.
        video.addEventListener('loadedmetadata', () => {
            logger.debug(`Calling video.requestPictureInPicture(), readyState=${video.readyState}`);

            video.requestPictureInPicture().then(() => {
                logger.debug('video.requestPictureInPicture() succeeded');
            }).catch((err: Error) => {
                logger.error(`Error while requesting PiP after metadata loaded: ${err.message}`);
            }).finally(() => {
                // Currently Electron will only pass the requests and execute requestPictureInPicture but
                // if the code there becomes more complicated it is worth considering to change the implementation
                // to handle errors on the Electron side to prevent the scenario where the code in Electron fails
                // and the this flag is not reset. This would prevent PiP for ever displaying again.
                pipRequestPending = false;
            });
        }, { once: true });

        return;
    }

    logger.debug(`Calling video.requestPictureInPicture(), readyState=${video.readyState}`);

    video.requestPictureInPicture().then(() => {
        logger.debug('video.requestPictureInPicture() succeeded');
    }).catch((err: Error) => {
        logger.error(`Error while requesting PiP: ${err.message}`);
    }).finally(() => {
        // Currently Electron will only pass the requests and execute requestPictureInPicture but
        // if the code there becomes more complicated it is worth considering to change the implementation
        // to handle errors on the Electron side to prevent the scenario where the code in Electron fails
        // and the this flag is not reset. This would prevent PiP for ever displaying again.
        pipRequestPending = false;
    });
}

/**
 * Action to enter Picture-in-Picture mode.
 * Handles both browser and Electron environments.
 *
 * @param {HTMLVideoElement} videoElement - The video element to call requestPictureInPicuture on.
 * @returns {void}
 */
export function enterVideoPiP(videoElement: HTMLVideoElement | undefined | null) {
    if (!videoElement) {
        logger.error('PiP video element not found');

        return;
    }

    // Check if a PiP request is already pending or PiP is already active.
    if (pipRequestPending) {
        logger.debug('PiP request already pending, skipping duplicate request');

        return;
    }

    if (document.pictureInPictureElement) {
        logger.debug('PiP already active, skipping request');

        return;
    }

    // Check if PiP is supported.
    if (!('pictureInPictureEnabled' in document)) {
        logger.error('Picture-in-Picture is not supported in this browser');

        return;
    }

    if (document.pictureInPictureEnabled === false) {
        logger.error('Picture-in-Picture is disabled');

        return;
    }

    try {
        // In Electron, use postMessage to request PiP from main process.
        // This bypasses the transient activation requirement by executing
        // requestPictureInPicture with userGesture: true in the main process.
        if (browser.isElectron()) {
            logger.log('Electron detected, sending postMessage to request PiP');
            pipRequestPending = true;

            APP.API.notifyPictureInPictureRequested();

            // State will be updated by enterpictureinpicture event.
            return;
        }

        // In browsers, directly request Video PiP.
        pipRequestPending = true;
        requestPictureInPicture();
    } catch (error) {
        pipRequestPending = false;
        logger.error('Error entering Picture-in-Picture:', error);
    }
}

/**
 * Sets an extended MediaSession action handler when supported by the browser.
 *
 * @param {ExtendedMediaSessionAction} action - The MediaSession action to configure.
 * @param {ExtendedMediaSessionActionHandler | null} handler - The action handler, or null to clear it.
 * @returns {void}
 */
function setExtendedMediaSessionActionHandler(
        action: ExtendedMediaSessionAction,
        handler: ExtendedMediaSessionActionHandler | null) {
    try {
        navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
        logger.debug(`MediaSession action '${action}' is not supported:`, error);
    }
}

/**
 * Sets up MediaSession API action handlers for controlling the conference.
 * Handlers dispatch actions that query fresh Redux state, avoiding stale closures.
 *
 * @param {Function} dispatch - Redux dispatch function.
 * @returns {void}
 */
export function setupMediaSessionHandlers(dispatch: IStore['dispatch']) {
    if ('mediaSession' in navigator && typeof navigator.mediaSession?.setActionHandler === 'function') {
        // Set up audio mute toggle handler.
        // Dispatch action that will query current state and toggle.
        setExtendedMediaSessionActionHandler('togglemicrophone', () => {
            dispatch(toggleAudioFromPiP());
        });

        // Set up video mute toggle handler.
        // Dispatch action that will query current state and toggle.
        setExtendedMediaSessionActionHandler('togglecamera', () => {
            dispatch(toggleVideoFromPiP());
        });

        // Set up hangup handler.
        setExtendedMediaSessionActionHandler('hangup', () => {
            dispatch(leaveConference());
        });

        logger.log('MediaSession API handlers registered for supported PiP controls');
    } else {
        logger.warn('MediaSession API not supported in this browser');
    }
}

/**
 * Updates the MediaSession API microphone and camera active state.
 * This ensures the PiP controls show the correct mute/unmute state.
 *
 * @param {IMediaSessionState} state - The current media session state.
 * @returns {void}
 */
export function updateMediaSessionState(state: IMediaSessionState) {
    // Safari requires user activation when setting MediaSession capture state.
    // This runs from a Redux subscriber outside the initiating user gesture,
    // so Safari rejects the request. Skip state synchronization for Safari.
    // observed behavior in v26.5.2
    if (browser.isSafari()) {
        return;
    }

    if ('mediaSession' in navigator) {
        const mediaSession = navigator.mediaSession as MediaSession & {
            setCameraActive?: (active: boolean) => void;
            setMicrophoneActive?: (active: boolean) => void;
        };

        try {
            if (mediaSession.setMicrophoneActive) {
                mediaSession.setMicrophoneActive(state.microphoneActive);
            }

            if (mediaSession.setCameraActive) {
                mediaSession.setCameraActive(state.cameraActive);
            }

            logger.log('MediaSession state updated:', state);
        } catch (error) {
            logger.warn('Error updating MediaSession state:', error);
        }
    }
}

/**
 * Cleans up MediaSession API action handlers.
 *
 * @returns {void}
 */
export function cleanupMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
        setExtendedMediaSessionActionHandler('togglemicrophone', null);
        setExtendedMediaSessionActionHandler('togglecamera', null);
        setExtendedMediaSessionActionHandler('hangup', null);
        logger.log('Supported MediaSession API handlers cleaned up');
    }
}

/**
 * Applies initial stylings of the main window to PiP window.
 * Creates the container for the PiP window.
 *
 * The reference to the opened window lives in the pip Redux state (see setPiPWindow), not here,
 * so that every change to it is observable by React.
 *
 * @param {Window} pipWindow - Current window.
 * @returns {void}
 */
export function initPiPWindow(pipWindow: Window) {
    copyStylesheets(pipWindow);
    createPiPContainer(pipWindow);
}

/**
 * Applies stylesheet links and inline styles from the originating window.
 *
 * @see https://developer.chrome.com/docs/web-platform/document-picture-in-picture#copy_style_sheets_to_pip
 * @param {Window} pipWindow - Current window.
 * @returns {void}
 */
function copyStylesheets(pipWindow: Window) {
    const { document: pipDoc } = pipWindow;

    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
        try {
            if (node instanceof HTMLStyleElement) {
                pipDoc.head.appendChild(pipDoc.importNode(node, true));

                return;
            }

            if (!(node instanceof HTMLLinkElement) || !node.href) {
                return;
            }

            const link = pipDoc.createElement('link');

            Array.from(node.attributes).forEach(attribute => {
                if (attribute.name !== 'href' && (attribute.name !== 'type' || attribute.value)) {
                    link.setAttribute(attribute.name, attribute.value);
                }
            });
            link.href = node.href;

            pipDoc.head.appendChild(link);
        } catch (error) {
            logger.warn('Failed to copy stylesheet:', error);
        }
    });
}

/**
 * Creates container for pip. Helpful for react portals.
 *
 * @see https://react.dev/reference/react-dom/createPortal
 * @param {Window} pipWindow - Current window.
 * @returns {void}
 */
function createPiPContainer(pipWindow: Window) {
    const pipDoc = pipWindow.document;

    // The copied stylesheets load asynchronously; until they land, the UA default body margin
    // and overflow would make the 100vw/100vh container overflow and flash scrollbars on every
    // open, so reset them synchronously.
    pipDoc.body.style.margin = '0';
    pipDoc.body.style.overflow = 'hidden';

    const container = pipDoc.createElement('div');

    container.id = 'pip-root';
    container.style.cssText = 'margin: 0; padding: 0; overflow: hidden; height: 100vh; width: 100vw;';
    pipDoc.body.appendChild(container);
}

/**
 * Checks if the Document Picture-in-Picture API is supported.
 * Keeps Electron on its existing Video PiP implementation.
 *
 * @returns {boolean} True if Document PiP is supported.
 */
export function isDocumentPiPSupported(): boolean {
    return !browser.isElectron() && 'documentPictureInPicture' in window;
}

// Re-export from shared file for external use.
export { isPiPEnabled };
