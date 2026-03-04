import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getAvatarFont, getAvatarInitialsColor } from '../../base/avatar/components/web/styles';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { getDisplayNameColor } from '../../display-name/components/web/styles';
import { getThumbnailBackgroundColor } from '../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { isPrejoinPageVisible } from '../../prejoin/functions.any';
import { handlePiPLeaveEvent, handlePipEnterEvent, handleWindowBlur, handleWindowFocus } from '../actions';
import { getPiPVideoTrack } from '../functions';
import { useCanvasAvatar } from '../hooks';
import logger from '../logger';

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
    const { classes, theme } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const previousTrackRef = useRef<any>(null);

    // Redux selectors.
    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector(getLocalParticipant);
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);

    // Use local participant during prejoin, otherwise large video participant.
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;

    // Get appropriate video track based on prejoin state.
    const videoTrack = useSelector((state: IReduxState) =>
        getPiPVideoTrack(state, participant)
    );
    const displayName = useSelector((state: IReduxState) =>
        participant?.id
            ? getParticipantDisplayName(state, participant.id)
            : ''
    );
    const customAvatarBackgrounds = useSelector((state: IReduxState) =>
        state['features/dynamic-branding']?.avatarBackgrounds || []
    );

    const dispatch: IStore['dispatch'] = useDispatch();
    const avatarFont = getAvatarFont(theme);
    const fontFamily = (avatarFont as any).fontFamily ?? 'Inter, sans-serif';
    const initialsColor = getAvatarInitialsColor(theme);
    const displayNameColor = getDisplayNameColor(theme);
    const { canvasStreamRef } = useCanvasAvatar({
        participant,
        displayName,
        customAvatarBackgrounds,
        backgroundColor: getThumbnailBackgroundColor(theme),
        fontFamily,
        initialsColor,
        displayNameColor
    });

    // Determine if we should show avatar instead of video.
    const shouldShowAvatar = !videoTrack
        || videoTrack.muted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));

    /**
     * Effect: Handle switching between real video track and canvas avatar stream.
     */
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const previousTrack = previousTrackRef.current;

        // Detach previous track.
        if (previousTrack?.jitsiTrack) {
            try {
                previousTrack.jitsiTrack.detach(videoElement);
            } catch (error) {
                logger.error('Error detaching previous track:', error);
            }
        }

        if (shouldShowAvatar) {
            // Use canvas stream for avatar.
            // Access ref inside effect - stream is created in useCanvasAvatar's effect.
            const canvasStream = canvasStreamRef.current;

            // Only set srcObject if it's different to avoid interrupting playback.
            if (canvasStream && videoElement.srcObject !== canvasStream) {
                videoElement.srcObject = canvasStream;
            }
        } else if (videoTrack?.jitsiTrack) {
            // Attach real video track.
            videoTrack.jitsiTrack.attach(videoElement)
                .catch((error: Error) => {
                    logger.error('Error attaching video track:', error);
                });
        }

        previousTrackRef.current = videoTrack;

        // Cleanup on unmount or track change.
        return () => {
            if (videoTrack?.jitsiTrack && videoElement) {
                try {
                    videoTrack.jitsiTrack.detach(videoElement);
                } catch (error) {
                    logger.error('Error during cleanup:', error);
                }
            }
        };
    }, [ videoTrack, shouldShowAvatar ]);

    /**
     * Effect: Window blur/focus and visibility change listeners.
     * Enters PiP on blur, exits on focus (matches old AOT behavior).
     */
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const onWindowBlur = () => dispatch(handleWindowBlur(videoElement));
        const onWindowFocus = () => {

            // In the use case where the PiP is closed by the 'X' or 'back to main window' buttons, this handler is
            // called before the leavepictureinpicture handler. From there we call document.exitPictureInPicture()
            // which seems to put Chrome into a weird state - document.exitPictureInPicture() never resolves, the
            // leavepictureinpicture is never triggered and it is not possible to display PiP again.
            // This is probably a browser bug. To workaround it we have the 100ms timeout here. This way this event
            // is triggered after the leavepictureinpicture event and everything seems to work well.
            setTimeout(() => {
                dispatch(handleWindowFocus());
            }, 100);
        };
        const onVisibilityChange = () => {
            if (document.hidden) {
                onWindowBlur();
            }
        };

        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Check if window is already blurred on mount (handles PiP enable while app is in background).
        // Wait for video to be ready before attempting PiP (canvas stream may not be attached yet).
        const checkFocusAndEnterPiP = () => {
            if (!document.hasFocus()) {
                onWindowBlur();
            }
        };

        if (videoElement.readyState >= 1) {
            // Video already has metadata loaded (e.g., real video track was already attached).
            checkFocusAndEnterPiP();
        } else {
            // Wait for video source to be ready (e.g., canvas stream being created).
            videoElement.addEventListener('loadedmetadata', checkFocusAndEnterPiP, { once: true });
        }

        return () => {
            window.removeEventListener('blur', onWindowBlur);
            window.removeEventListener('focus', onWindowFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            videoElement.removeEventListener('loadedmetadata', checkFocusAndEnterPiP);
        };
    }, [ dispatch ]);

    /**
     * Effect: PiP enter/leave event listeners.
     * Updates Redux state when browser PiP events occur.
     */
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
    }, [ dispatch ]);

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
