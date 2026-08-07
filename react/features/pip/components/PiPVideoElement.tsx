import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getAvatarFont, getAvatarInitialsColor } from '../../base/avatar/components/web/styles';
import { browser } from '../../base/lib-jitsi-meet';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { getDisplayNameColor } from '../../display-name/components/web/styles';
import { getThumbnailBackgroundColor } from '../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { isPrejoinPageVisible } from '../../prejoin/functions.any';
import { handlePiPLeaveEvent, handlePipEnterEvent, handleWindowBlur, handleWindowFocus } from '../actions';
import { FOCUS_CHECK_DELAY_MS } from '../constants';
import { getPiPVideoTrack } from '../functions';
import { useCanvasAvatar } from '../hooks';
import logger from '../logger';
import type { IWebKitPictureInPictureVideoElement } from '../types';

const baseVideoStyle = {
    width: '1px',
    height: '1px',
    pointerEvents: 'none' as const,
    opacity: 0,
    position: 'absolute' as const
};

const useStyles = makeStyles()(() => {
    return {
        hiddenVideo: {
            ...baseVideoStyle,
            left: '-9999px',
            top: '-9999px'
        },
        // Safari 26.5.2 was observed to produce black PiP content when this video was positioned offscreen.
        webKitVideo: {
            ...baseVideoStyle,
            left: 0,
            top: 0
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

    // Safari 26.5.2 fires `playing` after PiP is dismissed while hidden, which would immediately reopen PiP.
    const webKitPiPDismissedRef = useRef(false);

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
     * Effect: Use WebKit presentation modes to enter and leave Video PiP on tab switches.
     *
     */
    useEffect(() => {
        const videoElement = videoRef.current as IWebKitPictureInPictureVideoElement | null;

        if (!videoElement
                || !browser.isWebKitBased()
                || typeof videoElement.webkitSupportsPresentationMode !== 'function'
                || typeof videoElement.webkitSetPresentationMode !== 'function') {
            return;
        }

        let enteringWebKitPiP = false;
        let isPiPActive = false;

        const resumeWebKitPiPPlayback = () => {
            if (videoElement.webkitPresentationMode !== 'picture-in-picture'
                    || !videoElement.paused) {
                return;
            }

            // A muted live-MediaStream mirror has no meaningful paused state: any pause while in PiP
            // (Safari's hidden-tab interruption churn around the PiP transition, media keys) just
            // freezes the PiP frame, so playback is always resumed.
            videoElement.play()
                .catch(error => logger.warn('Failed to resume WebKit Picture-in-Picture video:', error));
        };
        const onEnterPiP = () => {
            if (!isPiPActive) {
                isPiPActive = true;
                dispatch(handlePipEnterEvent());
            }
        };
        const onLeavePiP = () => {
            if (!isPiPActive) {
                return;
            }

            isPiPActive = false;
            dispatch(handlePiPLeaveEvent());
            webKitPiPDismissedRef.current = document.hidden;

        };
        const enterWebKitPiP = async () => {
            if (enteringWebKitPiP || videoElement.webkitPresentationMode === 'picture-in-picture') {
                return;
            }
            enteringWebKitPiP = true;

            try {
                if (videoElement.paused) {
                    // Safari pauses hidden MediaStream videos, but a rejected play() (autoplay policy)
                    // must not prevent the PiP entry attempt — WebKit does the final eligibility check
                    // and the playback recovery below resumes playback once PiP is entered.
                    await videoElement.play()
                        .catch(error => logger.warn('Failed to play video before entering WebKit PiP:', error));
                }

                // The tab may have become visible or PiP may have been dismissed while play() was pending.
                if (!document.hidden || webKitPiPDismissedRef.current) {
                    return;
                }

                const hasCurrentMedia = !videoElement.ended
                    && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA;

                if (hasCurrentMedia
                        && videoElement.webkitSupportsPresentationMode?.('picture-in-picture')) {
                    videoElement.webkitSetPresentationMode?.('picture-in-picture');
                }
            } catch (error) {
                logger.warn('Failed to enter WebKit Picture-in-Picture:', error);
            } finally {
                enteringWebKitPiP = false;
            }
        };
        const exitWebKitPiP = () => {
            if (videoElement.webkitPresentationMode !== 'picture-in-picture') {
                return;
            }

            try {
                videoElement.webkitSetPresentationMode?.('inline');
            } catch (error) {
                logger.warn('Failed to exit WebKit Picture-in-Picture:', error);
            }
        };
        const onVisibilityChange = (event: Event) => {
            if (!event.isTrusted) {
                return;
            }

            if (document.hidden) {
                if (!webKitPiPDismissedRef.current) {
                    void enterWebKitPiP();
                }
            } else {
                webKitPiPDismissedRef.current = false;
                exitWebKitPiP();
            }
        };
        const onPlaying = (event: Event) => {
            if (event.isTrusted && document.hidden && !webKitPiPDismissedRef.current) {
                void enterWebKitPiP();
            }
        };
        const onWebKitPresentationModeChanged = () => {
            if (videoElement.webkitPresentationMode === 'picture-in-picture') {
                resumeWebKitPiPPlayback();
                onEnterPiP();
            } else {
                onLeavePiP();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        videoElement.addEventListener('pause', resumeWebKitPiPPlayback);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('webkitpresentationmodechanged', onWebKitPresentationModeChanged);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            videoElement.removeEventListener('pause', resumeWebKitPiPPlayback);
            videoElement.removeEventListener('playing', onPlaying);
            videoElement.removeEventListener('webkitpresentationmodechanged', onWebKitPresentationModeChanged);
            exitWebKitPiP();
        };
    }, [ dispatch ]);

    /**
     * Effect: Electron-only window blur/focus and visibility change listeners.
     * Enters PiP on blur and exits on focus, matching the old AOT behavior.
     */
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement || !browser.isElectron()) {
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
            }, FOCUS_CHECK_DELAY_MS);
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

        if (!videoElement || browser.isWebKitBased()) {
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
            className = { browser.isWebKitBased() ? classes.webKitVideo : classes.hiddenVideo }
            id = 'pipVideo'
            muted = { true }
            playsInline = { true }
            ref = { videoRef } />
    );
};

export default PiPVideoElement;
