import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { IStore } from '../app/types';
import IconUserSVG from '../base/icons/svg/user.svg?raw';
import { IParticipant } from '../base/participants/types';
import { TILE_ASPECT_RATIO } from '../filmstrip/constants';

import { openDocumentPiP } from './actions';
import { isDocumentPiPSupported, renderAvatarOnCanvas, updateMediaSessionState } from './functions';
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
}

/**
 * Result returned by the useCanvasAvatar hook.
 * Returns a ref object so consumers can access .current inside effects
 * (the stream is created in an effect and won't be available at render time).
 */
interface IUseCanvasAvatarResult {
    canvasStreamRef: React.MutableRefObject<MediaStream | null>;
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
 * as a video source when the participant's video is unavailable.
 *
 * @param {IUseCanvasAvatarOptions} options - The hook options.
 * @returns {IUseCanvasAvatarResult} The canvas stream for use as video source.
 */
export function useCanvasAvatar(options: IUseCanvasAvatarOptions): IUseCanvasAvatarResult {
    const {
        participant,
        displayName,
        customAvatarBackgrounds,
        backgroundColor,
        fontFamily,
        initialsColor,
        displayNameColor
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
     * Re-render avatar when participant or display name changes.
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
        ).then(() => {
            // Request a frame capture after drawing.
            // For captureStream(0), we need to manually trigger frame capture.
            const track = streamRef.current?.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void; };

            if (track?.requestFrame) {
                track.requestFrame();
                logger.log('Canvas frame requested after render');
            }
        }).catch((error: Error) => logger.error('Error rendering avatar on canvas:', error));
    }, [ participant?.loadableAvatarUrl, participant?.name, displayName, customAvatarBackgrounds, backgroundColor, fontFamily, initialsColor, displayNameColor ]);

    return {
        canvasStreamRef: streamRef
    };
}

/**
 * Manages Document Picture-in-Picture via the MediaSession API.
 * Opens a PiP window when a tab switch occurs using the
 * enterpictureinpicture MediaSession action handler.
 * Closes the PiP window when the tab becomes visible again.
 *
 * @see https://googlechrome.github.io/samples/media-session/video-conferencing.html
 *
 * @param {React.RefObject<HTMLDivElement>} playerRef - Ref to the player div to move into PiP.
 * @param {React.RefObject<HTMLDivElement>} containerRef - Ref to the container div (player's parent).
 * @param {boolean} microphoneActive - Whether the microphone is currently active.
 * @param {boolean} cameraActive - Whether the camera is currently active.
 * @returns {void}
 */
export function useDocumentPiPMediaSession(
        playerRef: React.RefObject<HTMLDivElement>,
        containerRef: React.RefObject<HTMLDivElement>,
        microphoneActive: boolean,
        cameraActive: boolean) {
    const pipWindowRef = useRef<Window | null>(null);
    const dispatch: IStore['dispatch'] = useDispatch();

    useEffect(() => {
        updateMediaSessionState({ microphoneActive, cameraActive });
    }, [ microphoneActive, cameraActive ]);

    const openDocumentPip = useCallback(
        () => dispatch(openDocumentPiP()),
        [ dispatch ]
    );

    useEffect(() => {
        if (!isDocumentPiPSupported()) {
            return;
        }

        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', async details => {
                const reason = details?.enterPictureInPictureReason;

                if (reason === 'useraction') {
                    logger.log('User clicked Enter Picture-in-Picture icon.');
                } else if (reason === 'contentoccluded') {
                    logger.log('Automatically enter picture-in-picture.');
                }

                await openDocumentPip();
            });
        } catch (error) {
            logger.warn('enterpictureinpicture MediaSession action not supported:', error);
        }

        return () => {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', null);
        };
    }, [ openDocumentPip ]);

    useEffect(() => {
        if (!isDocumentPiPSupported()) {
            return;
        }

        const onVisibilityChange = () => {
            if (!document.hidden && pipWindowRef.current && !pipWindowRef.current.closed) {
                if (playerRef.current && containerRef.current) {
                    containerRef.current.appendChild(playerRef.current);
                }
                pipWindowRef.current.close();
                pipWindowRef.current = null;
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [ playerRef, containerRef ]);
}
