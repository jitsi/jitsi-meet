import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import IconUserSVG from '../../base/icons/svg/user.svg?raw';
import { getParticipantDisplayName } from '../../base/participants/functions';
import { getVideoTrackByParticipant } from '../../base/tracks/functions.web';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { TILE_ASPECT_RATIO } from '../../filmstrip/constants';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { handlePiPLeaveEvent, handlePipEnterEvent, handleUserInteraction, handleWindowBlur } from '../actions';
import { renderAvatarOnCanvas } from '../functions';

const useStyles = makeStyles()(() => {
    return {
        hiddenVideo: {
            position: 'absolute' as const,
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none' as const,
            left: '-9999px',
            top: '-9999px'
        }
    };
});

/**
 * Component that renders a hidden video element for Picture-in-Picture.
 * Automatically switches between real video track and canvas-based avatar
 * depending on video availability.
 *
 * @returns {JSX.Element} The hidden video element.
 */
const PiPVideoElement: React.FC = () => {
    const { classes } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasStreamRef = useRef<MediaStream | null>(null);
    const defaultIconRef = useRef<HTMLImageElement | null>(null);
    const previousTrackRef = useRef<any>(null);
    // Get large video participant and their video track.
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const videoTrack = useSelector((state: IReduxState) =>
        getVideoTrackByParticipant(state, largeVideoParticipant)
    );
    const displayName = useSelector((state: IReduxState) =>
        largeVideoParticipant?.id
            ? getParticipantDisplayName(state, largeVideoParticipant.id)
            : ''
    );
    const customAvatarBackgrounds = useSelector((state: IReduxState) =>
        state['features/dynamic-branding']?.avatarBackgrounds || []
    );
    const dispatch: IStore['dispatch'] = useDispatch();
    const videoElement = videoRef.current;

    // Determine if we should show avatar instead of video.
    const shouldShowAvatar = !videoTrack
        || videoTrack.muted
        || !videoTrack.videoStarted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));

    /**
     * Initialize default icon image once.
     */
    useEffect(() => {
        if (!defaultIconRef.current) {
            let svgText = IconUserSVG;

            if (!svgText.includes('fill=')) {
                svgText = svgText.replace('<svg', '<svg fill="#FFFFFF"');
            }
            const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgText)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22')}`;

            const img = new Image();

            img.src = dataUrl;
            defaultIconRef.current = img;
        }
    }, []);

    /**
     * Effect: Handle switching between real video and canvas avatar.
     */
    useEffect(() => {
        if (!videoElement) {
            return;
        }

        const previousTrack = previousTrackRef.current;

        // Detach previous track.
        if (previousTrack?.jitsiTrack) {
            try {
                previousTrack.jitsiTrack.detach(videoElement);
            } catch (error) {
                console.error('Error detaching previous track:', error);
            }
        }

        if (shouldShowAvatar) {
            // Create canvas if needed.
            if (!canvasRef.current) {
                const canvas = document.createElement('canvas');
                const width = 640;
                const height = Math.floor(width / TILE_ASPECT_RATIO);

                canvas.width = width;
                canvas.height = height;
                canvasRef.current = canvas;

                const stream = canvas.captureStream(30);

                canvasStreamRef.current = stream;
            }

            // Always set srcObject to canvas stream when showing avatar.
            if (canvasStreamRef.current && videoElement.srcObject !== canvasStreamRef.current) {
                videoElement.srcObject = canvasStreamRef.current;
            }

            // Render avatar on canvas.
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                renderAvatarOnCanvas(
                    canvas,
                    ctx,
                    largeVideoParticipant,
                    displayName,
                    customAvatarBackgrounds,
                    defaultIconRef.current
                )
                    .then(() => videoElement.play())
                    .catch(error => console.error('Error rendering avatar:', error));
            }
        } else if (videoTrack?.jitsiTrack) {
            // Attach real video track.
            videoTrack.jitsiTrack.attach(videoElement)
                .then(() => videoElement.play())
                .catch((error: Error) => {
                    console.error('Error attaching video track:', error);
                });
        }

        previousTrackRef.current = videoTrack;

        // Cleanup.
        return () => {
            if (videoTrack?.jitsiTrack && videoElement) {
                try {
                    videoTrack.jitsiTrack.detach(videoElement);
                } catch (error) {
                    console.error('Error during cleanup:', error);
                }
            }
        };
    }, [
        videoTrack,
        shouldShowAvatar,
        largeVideoParticipant,
        displayName,
        customAvatarBackgrounds
    ]);

    /**
     * Cleanup canvas on unmount.
     */
    useEffect(() => {
        return () => {
            if (canvasStreamRef.current) {
                canvasStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    /**
     * Effect to listen for window blur and page visibility changes to enter PiP.
     * PiP is exited only when user explicitly interacts with the page.
     */
    useEffect(() => {
        if (!videoElement) {
            return;
        }
        const onWindowBlur = () => dispatch(handleWindowBlur(videoElement));
        const onUserInteraction = () => dispatch(handleUserInteraction());

        // Listen for window blur events to enter PiP.
        window.addEventListener('blur', onWindowBlur);

        // Listen for page visibility changes (tab switching) to enter PiP.
        const onVisibilityChange = () => {
            if (document.hidden) {
                onWindowBlur();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        // Listen for user interactions to exit PiP.
        // Using 'click' and 'keydown' as primary interaction signals.
        document.addEventListener('click', onUserInteraction);
        document.addEventListener('keydown', onUserInteraction);

        return () => {
            window.removeEventListener('blur', onWindowBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('click', onUserInteraction);
            document.removeEventListener('keydown', onUserInteraction);
        };
    }, [ dispatch, videoElement ]);

    /**
     * Effect to listen for PiP events from the browser.
     * Dispatches actions to update Redux state when PiP is entered or exited.
     */
    useEffect(() => {
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
    }, [ videoElement, dispatch ]);

    return (
        <video
            autoPlay = { true }
            className = { classes.hiddenVideo }
            id = 'pipVideo'
            muted = { true }
            playsInline = { true }
            ref = { videoRef } />
    );
};

export default PiPVideoElement;
