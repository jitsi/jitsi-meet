import { IReduxState, IStore } from '../app/types';
import { AVATAR_DEFAULT_BACKGROUND_COLOR } from '../base/avatar/components/web/styles';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { leaveConference } from '../base/conference/actions';
import { browser } from '../base/lib-jitsi-meet';
import { getParticipantById, getRemoteParticipants, getRemoteParticipantsSorted } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { getLocalVideoTrack } from '../base/tracks/functions.any';
import { getVideoTrackByParticipant } from '../base/tracks/functions.web';
import { isPrejoinPageVisible } from '../prejoin/functions.any';

import { toggleAudioFromPiP, toggleVideoFromPiP } from './actions';
import { isDocumentPiPSupported, isPiPEnabled } from './external-api.shared';
import logger from './logger';
import { IMediaSessionState } from './types';

/**
 * Flag to track if a PiP request is currently pending (requested but not yet entered).
 *
 * This prevents duplicate PiP entry requests that can occur on macOS when minimizing
 * a window. On minimize, both the 'blur' event and 'visibilitychange' event fire in
 * rapid succession (within ~10ms), each triggering enterPiP(). Without this guard,
 * Electron receives two PiP requests before the first one completes, causing the
 * first PiP to immediately exit and triggering a pip leave event that will cause the window to be restored.
 */
let pipRequestPending = false;

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
 * Maximum number of remote participant tiles shown in the Document PiP grid.
 */
const MAX_PIP_GRID_TILES = 8;

/**
 * Gets the remote participants displayed in the Document PiP grid, ordered as
 * in the filmstrip and capped to keep the floating window readable.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {Array<IParticipant>} The participants to render in the grid.
 */
export function getPiPGridParticipants(state: IReduxState): IParticipant[] {
    const sortedIds = getRemoteParticipantsSorted(state);
    const ids = sortedIds.length ? sortedIds : Array.from(getRemoteParticipants(state).keys());

    return ids
        .slice(0, MAX_PIP_GRID_TILES)
        .map(id => getParticipantById(state, id))
        .filter((p): p is IParticipant => Boolean(p));
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

    // Check if PiP is enabled at all.
    if (!isPiPEnabled(pipConfig)) {
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

        return;
    }
    if (document.pictureInPictureElement) {
        logger.warn('Already in PiP mode');

        return;
    }

    // Check if video metadata is loaded.
    // readyState >= 1 (HAVE_METADATA) means video dimensions are available.
    if (video.readyState < 1) {
        logger.warn('Video metadata not loaded yet, waiting...');

        // Wait for metadata to load before requesting PiP.
        video.addEventListener('loadedmetadata', () => {
            logger.debug(`Calling video.requestPictureInPicture(), readyState=${video.readyState}`);

            // @ts-ignore - requestPictureInPicture is not yet in all TypeScript definitions.
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

    // @ts-ignore - requestPictureInPicture is not yet in all TypeScript definitions.
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
export function enterPiP(videoElement: HTMLVideoElement | undefined | null) {
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

        // In browsers, directly request native (video element) Picture-in-Picture.
        // requestPictureInPicture() resets pipRequestPending in its finally block.
        // NOTE: browsers may require transient user activation; if so the request
        // rejects and is logged without breaking the app (clean fallback). The
        // video's `autoPictureInPicture` attribute covers the auto-enter case.
        pipRequestPending = true;
        requestPictureInPicture();
    } catch (error) {
        logger.error('Error entering Picture-in-Picture:', error);
    }
}

/**
 * Module-level reference to the currently open Document Picture-in-Picture window.
 * Kept here (instead of Redux) because a Window object is not serializable.
 */
let documentPiPWindow: Window | null = null;

/**
 * Observer that keeps the PiP window stylesheets in sync with the main document.
 */
let pipStyleObserver: MutationObserver | null = null;

/**
 * Guards against concurrent requestWindow() calls. The auto-enter triggers
 * (MediaSession action + window blur/visibilitychange) can fire within the same
 * tick, and requestWindow() is async, so without this flag two windows could be
 * requested before the first sets documentPiPWindow.
 */
let documentPiPRequestPending = false;

/**
 * Returns the currently open Document PiP window, or null if none is open.
 *
 * @returns {Window | null} The PiP window.
 */
export function getDocumentPiPWindow(): Window | null {
    return documentPiPWindow;
}

/**
 * Copies the parent document stylesheets into the Document PiP window so the
 * portaled React content is styled identically. Also keeps the PiP window in
 * sync with stylesheets injected later (e.g. tss-react/makeStyles on first
 * render), so the very first PiP open is styled correctly too.
 *
 * @param {Window} pipWindow - The Picture-in-Picture window.
 * @returns {void}
 */
function copyStylesToPiP(pipWindow: Window) {
    const syncStyles = () => {
        pipWindow.document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(n => n.remove());
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                const cssRules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('');
                const style = pipWindow.document.createElement('style');

                style.textContent = cssRules;
                pipWindow.document.head.appendChild(style);
            } catch {
                // Cross-origin stylesheet: copy by link reference instead.
                const link = pipWindow.document.createElement('link');

                link.rel = 'stylesheet';
                link.href = (sheet as CSSStyleSheet).href ?? '';
                pipWindow.document.head.appendChild(link);
            }
        });
    };

    syncStyles();

    // Re-sync after the first frames to capture rules injected via insertRule into
    // existing tags (CSS-in-JS), which a childList observer would not catch.
    pipWindow.requestAnimationFrame(syncStyles);
    setTimeout(syncStyles, 200);

    // Re-sync when stylesheets are injected later (e.g. tss-react/makeStyles on first render).
    pipStyleObserver = new MutationObserver(syncStyles);
    pipStyleObserver.observe(document.head, { childList: true });
}

/**
 * Opens the rich Document Picture-in-Picture window (Google Meet style). The
 * React content is rendered into it by the DocumentPiP component via a portal.
 *
 * @param {Function} onClose - Callback invoked when the PiP window is closed.
 * @returns {Promise<Window | null>} The opened window or null on failure.
 */
export async function openDocumentPiP(onClose: () => void): Promise<Window | null> {
    if (!isDocumentPiPSupported()) {
        return null;
    }

    if (documentPiPWindow) {
        return documentPiPWindow;
    }

    if (documentPiPRequestPending) {
        return null;
    }

    documentPiPRequestPending = true;

    try {
        // @ts-ignore - documentPictureInPicture is not yet in all TS lib definitions.
        const pipWindow: Window = await window.documentPictureInPicture.requestWindow({
            width: 360,
            height: 240
        });

        copyStylesToPiP(pipWindow);
        documentPiPWindow = pipWindow;
        pipWindow.addEventListener('pagehide', () => {
            pipStyleObserver?.disconnect();
            pipStyleObserver = null;
            documentPiPWindow = null;
            onClose();
        }, { once: true });

        return pipWindow;
    } catch (error) {
        logger.error('Failed to open Document PiP window:', error);

        return null;
    } finally {
        documentPiPRequestPending = false;
    }
}

/**
 * Closes the Document Picture-in-Picture window if open.
 *
 * @returns {void}
 */
export function closeDocumentPiP() {
    if (pipStyleObserver) {
        pipStyleObserver.disconnect();
        pipStyleObserver = null;
    }
    if (documentPiPWindow) {
        documentPiPWindow.close();
        documentPiPWindow = null;
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
    // @ts-ignore - MediaSession API is not fully typed in all environments.
    if ('mediaSession' in navigator && navigator.mediaSession?.setActionHandler) {
        try {
            // Set up audio mute toggle handler.
            // Dispatch action that will query current state and toggle.
            // @ts-ignore - togglemicrophone is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('togglemicrophone', () => {
                dispatch(toggleAudioFromPiP());
            });

            // Set up video mute toggle handler.
            // Dispatch action that will query current state and toggle.
            // @ts-ignore - togglecamera is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('togglecamera', () => {
                dispatch(toggleVideoFromPiP());
            });

            // Set up hangup handler.
            // @ts-ignore - hangup is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('hangup', () => {
                dispatch(leaveConference());
            });

            logger.log('MediaSession API handlers registered for PiP controls');
        } catch (error) {
            logger.warn('Some MediaSession actions not supported:', error);
        }
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
    if ('mediaSession' in navigator) {
        try {
            // @ts-ignore - setMicrophoneActive is a newer MediaSession method.
            if (navigator.mediaSession.setMicrophoneActive) {
                // @ts-ignore
                navigator.mediaSession.setMicrophoneActive(state.microphoneActive);
            }

            // @ts-ignore - setCameraActive is a newer MediaSession method.
            if (navigator.mediaSession.setCameraActive) {
                // @ts-ignore
                navigator.mediaSession.setCameraActive(state.cameraActive);
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
        try {
            // Note: Setting handlers to null is commented out as it may cause issues
            // in some browsers. The handlers will be overwritten when entering PiP again.
            // @ts-ignore - togglemicrophone is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('togglemicrophone', null);
            // @ts-ignore - togglecamera is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('togglecamera', null);
            // @ts-ignore - hangup is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('hangup', null);
            logger.log('MediaSession API handlers cleaned up');
        } catch (error) {
            logger.error('Error cleaning up MediaSession handlers:', error);
        }
    }
}

// Re-export from shared file for external use.
export { isPiPEnabled };

