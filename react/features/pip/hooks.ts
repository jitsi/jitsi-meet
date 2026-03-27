import React, { useEffect, useRef } from 'react';

import { IStore } from '../app/types';
import IconUserSVG from '../base/icons/svg/user.svg?raw';
import { IParticipant } from '../base/participants/types';
import { ITrack } from '../base/tracks/types';
import { TILE_ASPECT_RATIO } from '../filmstrip/constants';

import { handlePiPLeaveEvent, handlePipEnterEvent, handleWindowBlur, handleWindowFocus } from './actions';
import { renderAvatarOnCanvas } from './functions';
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
 * Delay before exiting PiP on focus to avoid Chrome getting stuck when the PiP
 * window is closed by browser chrome controls.
 */
const WINDOW_FOCUS_EXIT_DELAY_MS = 100;

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
 * Keeps the hidden PiP video element in sync with the currently selected video
 * source, switching between the participant track and the generated avatar
 * canvas stream.
 *
 * @param {React.RefObject<HTMLVideoElement | null>} videoRef - Ref to the PiP
 * video element.
 * @param {React.MutableRefObject<ITrack | undefined>} previousTrackRef - Ref to
 * the previously attached video track.
 * @param {ITrack | undefined} videoTrack - Current video track to display.
 * @param {boolean} shouldShowAvatar - Whether the avatar canvas should be used
 * instead of a participant video track.
 * @param {React.MutableRefObject<MediaStream | null>} canvasStreamRef - Ref to
 * the generated avatar canvas stream.
 * @returns {void}
 */
export function usePiPVideoSource(
        videoRef: React.RefObject<HTMLVideoElement | null>,
        previousTrackRef: React.MutableRefObject<ITrack | undefined>,
        videoTrack: ITrack | undefined,
        shouldShowAvatar: boolean,
        canvasStreamRef: React.MutableRefObject<MediaStream | null>
) {
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const previousTrack = previousTrackRef.current;

        if (previousTrack?.jitsiTrack) {
            try {
                previousTrack.jitsiTrack.detach(videoElement);
            } catch (error) {
                logger.error('Error detaching previous track:', error);
            }
        }

        if (shouldShowAvatar) {
            const canvasStream = canvasStreamRef.current;

            if (canvasStream && videoElement.srcObject !== canvasStream) {
                videoElement.srcObject = canvasStream;
            }
        } else if (videoTrack?.jitsiTrack) {
            videoTrack.jitsiTrack.attach(videoElement)
                .catch((error: Error) => {
                    logger.error('Error attaching video track:', error);
                });
        }

        previousTrackRef.current = videoTrack;

        return () => {
            if (videoTrack?.jitsiTrack && videoElement) {
                try {
                    videoTrack.jitsiTrack.detach(videoElement);
                } catch (error) {
                    logger.error('Error during cleanup:', error);
                }
            }
        };
    }, [ canvasStreamRef, previousTrackRef, shouldShowAvatar, videoRef, videoTrack ]);
}

/**
 * Registers the window and document events that automatically enter/exit PiP
 * based on app focus.
 *
 * @param {Object} videoRef - Ref to the PiP video element.
 * @param {Function} dispatch - Redux dispatch function.
 * @returns {void}
 */
export function usePiPWindowLifecycle(
        videoRef: React.RefObject<HTMLVideoElement | null>,
        dispatch: IStore['dispatch']
) {
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const onWindowBlur = () => dispatch(handleWindowBlur(videoElement));
        const onWindowFocus = () => {
            setTimeout(() => {
                dispatch(handleWindowFocus());
            }, WINDOW_FOCUS_EXIT_DELAY_MS);
        };
        const onVisibilityChange = () => {
            if (document.hidden) {
                onWindowBlur();
            }
        };
        const checkFocusAndEnterPiP = () => {
            if (!document.hasFocus()) {
                onWindowBlur();
            }
        };

        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        if (videoElement.readyState >= 1) {
            checkFocusAndEnterPiP();
        } else {
            videoElement.addEventListener('loadedmetadata', checkFocusAndEnterPiP, { once: true });
        }

        return () => {
            window.removeEventListener('blur', onWindowBlur);
            window.removeEventListener('focus', onWindowFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            videoElement.removeEventListener('loadedmetadata', checkFocusAndEnterPiP);
        };
    }, [ dispatch, videoRef ]);
}

/**
 * Registers browser PiP enter/leave events for the hidden PiP video element
 * and forwards them to the Redux handlers.
 *
 * @param {Object} videoRef - Ref to the PiP video element.
 * @param {Function} dispatch - Redux dispatch function.
 * @returns {void}
 */
export function usePiPBrowserEvents(
        videoRef: React.RefObject<HTMLVideoElement | null>,
        dispatch: IStore['dispatch']
) {
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const onEnterPiP = () => {
            dispatch(handlePipEnterEvent());
        };
        const onLeavePiP = () => {
            dispatch(handlePiPLeaveEvent());
        };

        videoElement.addEventListener('enterpictureinpicture', onEnterPiP);
        videoElement.addEventListener('leavepictureinpicture', onLeavePiP);

        return () => {
            videoElement.removeEventListener('enterpictureinpicture', onEnterPiP);
            videoElement.removeEventListener('leavepictureinpicture', onLeavePiP);
        };
    }, [ dispatch, videoRef ]);
}
