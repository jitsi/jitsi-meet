import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../app/types';
import IconUserSVG from '../base/icons/svg/user.svg?raw';
import { browser } from '../base/lib-jitsi-meet';
import { IParticipant } from '../base/participants/types';
import { isEmbedded } from '../base/util/embedUtils';
import { TILE_ASPECT_RATIO } from '../filmstrip/constants';

import { hidePiP, openDocumentPiP } from './actions';
import PiPTriggerButton from './components/web/PiPTriggerButton';
import {
    isDocumentPiPSupported,
    renderAvatarOnCanvas,
    shouldShowPiP,
} from './functions';
import logger from './logger';

/**
 * Canvas dimensions for PiP avatar rendering.
 */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH / TILE_ASPECT_RATIO);

/**
 * Frame rate 0 means capture on-demand when canvas changes.
 * We manually request frames after drawing to ensure capture.
 */
const CANVAS_FRAME_RATE = 0;
const EMBEDDED_DOCUMENT_PIP_CAPABILITY_TIMEOUT = 10000;

const togglePiP = {
    key: 'toggle-pip',
    Content: PiPTriggerButton,
    group: 2
};

/**
 * Options for the useCanvasAvatar hook.
 */
interface IUseCanvasAvatarOptions {
    backgroundColor: string;
    customAvatarBackgrounds: string[];
    displayName: string;
    displayNameColor: string;
    fontFamily: string;
    initialsColor: string;
    participant: IParticipant | undefined;
    shouldShowAvatar: boolean;
}

/**
 * Result returned by the useCanvasAvatar hook.
 * The stream ref is populated in an effect, while publishFrame lets consumers
 * explicitly deliver the current canvas after attaching it to a video element.
 */
interface IUseCanvasAvatarResult {
    canvasStreamRef: React.MutableRefObject<MediaStream | null>;
    publishFrame: () => void;
}

/**
 * Internal refs managed by the hook.
 */
interface ICanvasRefs {
    canvas: HTMLCanvasElement | null;
    defaultIcon: HTMLImageElement | null;
}

/**
 * Loads and prepares the default user icon SVG as an Image element.
 *
 * @returns {HTMLImageElement} The prepared image element.
 */
function createDefaultIconImage(): HTMLImageElement {
    let svgText = IconUserSVG;

    if (!svgText.includes('fill=')) {
        svgText = svgText.replace('<svg', '<svg fill="#FFFFFF"');
    }

    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgText)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22')}`;

    const img = new Image();

    img.src = dataUrl;

    return img;
}

/**
 * Custom hook that manages canvas-based avatar rendering for Picture-in-Picture.
 * Creates and maintains a canvas element with a MediaStream that can be used
 * as a video source when the participant's video is unavailable. Avatar rendering
 * is gated by shouldShowAvatar, while hidden content is cleared to avoid stale identity frames.
 *
 * @param {IUseCanvasAvatarOptions} options - The hook options.
 * @returns {IUseCanvasAvatarResult} The canvas stream and frame publication callback.
 */
export function useCanvasAvatar(options: IUseCanvasAvatarOptions): IUseCanvasAvatarResult {
    const {
        participant,
        displayName,
        customAvatarBackgrounds,
        backgroundColor,
        fontFamily,
        initialsColor,
        displayNameColor,
        shouldShowAvatar
    } = options;

    const refs = useRef<ICanvasRefs>({
        canvas: null,
        defaultIcon: null
    });

    // Separate ref for the stream to return to consumers.
    // This allows consumers to access .current inside their effects.
    //
    // NOTE: If we ever need to recreate the stream (e.g., different canvas size),
    // consumers' effects won't automatically re-run since refs don't trigger re-renders.
    // To fix this, we could return an additional state flag like `streamReady` that
    // changes when the stream is set, and consumers would add it to their effect deps.
    const streamRef = useRef<MediaStream | null>(null);

    /**
     * Publishes the canvas's current contents to its on-demand capture stream.
     *
     * @returns {void}
     */
    const publishFrame = useCallback(() => {
        const track = streamRef.current?.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void; };
        const canvas = refs.current.canvas;

        if (!track?.requestFrame || !canvas) {
            return;
        }

        track.requestFrame();

        // WebKit emits a canvas-capture frame only when the canvas is painted AFTER requestFrame()
        // has armed the capture — a bare requestFrame() on a static canvas produces nothing and the
        // PiP video stays at readyState 0 (verified on Safari 26.6). Nudge the canvas with an
        // imperceptible 1px draw so an emission paint always follows the arm. Chromium captures
        // the current canvas contents immediately on requestFrame(), so it needs no nudge.
        if (browser.isWebKitBased()) {
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.save();
                ctx.globalAlpha = 0.01;
                ctx.fillRect(0, 0, 1, 1);
                ctx.restore();
            }
        }

        logger.log('Canvas frame requested');
    }, []);

    /**
     * Initialize canvas, stream, and default icon on mount.
     */
    useEffect(() => {
        // Create canvas.
        const canvas = document.createElement('canvas');

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        refs.current.canvas = canvas;

        // Create stream from canvas.
        streamRef.current = canvas.captureStream(CANVAS_FRAME_RATE);

        // Load default icon.
        refs.current.defaultIcon = createDefaultIconImage();

        logger.log('Canvas avatar initialized');

        // Cleanup on unmount.
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            refs.current.canvas = null;
            refs.current.defaultIcon = null;
            logger.log('Canvas avatar cleaned up');
        };
    }, []);

    /**
     * Renders the avatar when it should be shown and clears stale participant content otherwise.
     */
    useEffect(() => {
        const { canvas, defaultIcon } = refs.current;

        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            logger.error('Failed to get canvas 2D context');

            return;
        }

        // Clear participant identity synchronously before the canvas can be attached to a new sink.
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!shouldShowAvatar) {
            return;
        }

        renderAvatarOnCanvas(
            canvas,
            ctx,
            participant,
            displayName,
            customAvatarBackgrounds,
            defaultIcon,
            backgroundColor,
            fontFamily,
            initialsColor,
            displayNameColor
        ).then(publishFrame)
            .catch((error: Error) => logger.error('Error rendering avatar on canvas:', error));
    }, [ participant?.loadableAvatarUrl, participant?.loadableAvatarUrlUseCORS, participant?.name, displayName, customAvatarBackgrounds, backgroundColor, fontFamily, initialsColor, displayNameColor, shouldShowAvatar, publishFrame ]);

    return {
        canvasStreamRef: streamRef,
        publishFrame
    };
}

/**
 * Manages Document Picture-in-Picture via the MediaSession API in browsers that support its
 * enterpictureinpicture action. WebKit automatic Video PiP on tab switches is managed separately by PiPVideoElement
 * through the presentation-mode API.
 * Closes the PiP window when the tab becomes visible again.
 *
 * MediaSession playback state is kept in sync by the subscriber in
 * subscriber.ts, so this hook only handles the window lifecycle.
 *
 * @see https://googlechrome.github.io/samples/media-session/video-conferencing.html
 *
 * @returns {void}
 */
export function useDocumentPiPMediaSession() {
    const dispatch: IStore['dispatch'] = useDispatch();

    const openDocumentPip = useCallback(
        (notifyOnFailure: boolean) => dispatch(openDocumentPiP({ notifyOnFailure })),
        [ dispatch ]
    );

    const embedded = isEmbedded();
    const embeddedDocumentPiPAvailable = useSelector(
        (state: IReduxState) => state['features/pip']?.embeddedDocumentPiPAvailable);
    const isPiPActive = useSelector((state: IReduxState) => state['features/pip']?.isPiPActive ?? false);
    const pipEnabled = useSelector(shouldShowPiP);
    const documentPiPAvailable = pipEnabled && (embedded
        ? embeddedDocumentPiPAvailable
        : isDocumentPiPSupported());

    useEffect(() => {
        if (!documentPiPAvailable
                || !('mediaSession' in navigator)
                || typeof navigator.mediaSession?.setActionHandler !== 'function') {
            return;
        }

        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', details => {
                const reason = details?.enterPictureInPictureReason;

                if (reason === 'useraction') {
                    logger.log('User clicked Enter Picture-in-Picture icon.');
                } else if (reason === 'contentoccluded') {
                    logger.log('Automatically enter picture-in-picture.');
                }

                // The browser invokes this handler fire-and-forget, so nothing may leak a
                // rejection here. openDocumentPiP() reports every failure internally: it always
                // logs, and for user-initiated entries it also shows the same error notification
                // as the toolbar button; automatic entries stay silent to avoid nagging on every
                // tab switch.
                openDocumentPip(reason === 'useraction');
            });
        } catch (error) {
            logger.warn('enterpictureinpicture MediaSession action not supported:', error);
        }

        return () => {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', null);
        };
    }, [ documentPiPAvailable, openDocumentPip ]);

    useEffect(() => {
        if (!embedded || embeddedDocumentPiPAvailable !== undefined) {
            return;
        }

        const timeout = window.setTimeout(() => {
            dispatch(handleEmbeddedDocumentPiPCapabilityTimeout());
        }, EMBEDDED_DOCUMENT_PIP_CAPABILITY_TIMEOUT);

        return () => window.clearTimeout(timeout);
    }, [ dispatch, embedded, embeddedDocumentPiPAvailable ]);

    useEffect(() => {
        if (!documentPiPAvailable) {
            return;
        }

        const onVisibilityChange = () => {
            // hidePiP() checks the current PiP state inside the thunk, so the handler needs no
            // state in its closure and the listener registers once for the lifetime of the mount.
            if (!document.hidden) {
                dispatch(hidePiP());
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [ dispatch, documentPiPAvailable, embedded, isPiPActive ]);

}

/**
 * Returns the PiP toggle button when PiP is enabled and supported by the browser.
 *
 * @returns {Object | undefined} The PiP toggle button or undefined.
 */
export function usePipToggleButton() {
    const visible = useSelector((state: IReduxState) => {
        if (state['features/base/config'].pip?.showToolbarButton === false || !shouldShowPiP(state)) {
            return false;
        }

        if (isEmbedded()) {
            const available = state['features/pip']?.embeddedDocumentPiPAvailable;

            return available === true || (available === false && Boolean(document.pictureInPictureEnabled));
        }

        return !browser.isElectron() && (isDocumentPiPSupported() || Boolean(document.pictureInPictureEnabled));
    });

    return visible ? togglePiP : undefined;
}
