import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant, getParticipantDisplayName } from '../../../base/participants/functions';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isPrejoinPageVisible } from '../../../prejoin/functions.any';
import HangupButton from '../../../toolbox/components/HangupButton';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';
import { getPiPVideoTrack, shouldShowPiPAvatar } from '../../functions';
import logger from '../../logger';

/**
 * Background of the PiP window; matches the legacy always-on-top window.
 */
const BACKGROUND_COLOR = '#474747';

/**
 * Time without mouse movement after which the toolbar fades out; matches the
 * legacy always-on-top window.
 */
const TOOLBAR_TIMEOUT_MS = 4000;

/**
 * Icon size and padding of the compact toolbar buttons; matches the legacy
 * always-on-top toolbar (22px icons with 7px padding, i.e. 36px buttons).
 */
const TOOLBAR_ICON_SIZE = 22;
const TOOLBAR_ICON_PADDING = 7;

/**
 * Smallest avatar rendered while the window size is not known yet.
 */
const MIN_AVATAR_SIZE = 40;

const useStyles = makeStyles()(theme => {
    return {
        container: {
            backgroundColor: BACKGROUND_COLOR,
            color: theme.palette.text01,
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
            userSelect: 'none',
            width: '100vw',

            '& *, & *::before, & *::after': {
                boxSizing: 'border-box'
            }
        },
        videoElement: {
            backgroundColor: BACKGROUND_COLOR,
            display: 'block',
            height: '100%',
            objectFit: 'contain',
            width: '100%'
        },

        // The legacy avatar screen: the avatar takes half of the window height
        // and sits a quarter of the height from the top, with the display name
        // right underneath - the only place the name is ever shown.
        avatarScreen: {
            height: '100%',
            paddingTop: '25vh',
            textAlign: 'center',
            width: '100%'
        },
        avatarContainer: {
            display: 'inline-block'
        },
        displayName: {
            fontSize: '0.875rem',
            marginTop: theme.spacing(2),
            overflow: 'hidden',
            padding: `0 ${theme.spacing(2)}`,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        },

        // The legacy compact toolbar: a small pill at the bottom center that
        // appears on mouse movement and fades out when idle.
        toolbar: {
            backgroundColor: theme.palette.uiBackground,
            borderRadius: '3px',
            bottom: '10px',
            display: 'flex',
            flexDirection: 'row',
            left: '50%',
            opacity: 0,
            padding: '3px',
            pointerEvents: 'none',
            position: 'absolute',
            transform: 'translateX(-50%)',
            transition: 'opacity 0.3s ease',
            zIndex: 10,

            '& .toolbox-icon': {
                cursor: 'pointer',
                height: `${TOOLBAR_ICON_SIZE}px`,
                padding: `${TOOLBAR_ICON_PADDING}px`,
                width: `${TOOLBAR_ICON_SIZE}px`,

                '&.toggled': {
                    background: 'none'
                },

                '& svg': {
                    height: `${TOOLBAR_ICON_SIZE}px`,
                    width: `${TOOLBAR_ICON_SIZE}px`
                }
            },

            '& .toolbox-icon.hangup-button': {
                backgroundColor: theme.palette.actionDanger,

                '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                        backgroundColor: theme.palette.actionDangerHover
                    },

                    '&:active': {
                        backgroundColor: theme.palette.actionDangerActive
                    }
                },

                '& svg': {
                    fill: theme.palette.icon01
                }
            }
        },
        toolbarVisible: {
            opacity: 1,
            pointerEvents: 'auto'
        }
    };
});

/**
 * Tracks the inner height of the PiP window so the avatar can be sized
 * relative to it, matching the legacy always-on-top proportions.
 *
 * @param {Window | null} pipWindow - The PiP window.
 * @returns {number} The window's inner height in CSS pixels.
 */
function usePiPWindowHeight(pipWindow: Window | null): number {
    const [ height, setHeight ] = useState(pipWindow?.innerHeight ?? 0);

    useEffect(() => {
        if (!pipWindow) {
            return;
        }

        const update = () => setHeight(pipWindow.innerHeight);

        update();
        pipWindow.addEventListener('resize', update);

        return () => {
            pipWindow.removeEventListener('resize', update);
        };
    }, [ pipWindow ]);

    return height;
}

/**
 * Renders the participant video or avatar and the compact controls inside the PiP window, looking
 * like the legacy always-on-top window: video fills the window with no overlays, the avatar screen
 * shows the avatar with the display name underneath, and the toolbar fades in on mouse movement.
 *
 * @returns {React.ReactElement}
 */
export function DocumentPiPView() {
    const { classes, cx } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const toolbarHoveredRef = useRef(false);
    const [ toolbarVisible, setToolbarVisible ] = useState(false);
    const pipWindow = useSelector((state: IReduxState) => state['features/pip'].pipWindow);
    const windowHeight = usePiPWindowHeight(pipWindow);
    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;
    const videoTrack = useSelector((state: IReduxState) => getPiPVideoTrack(state, participant));
    const participantName = useSelector((state: IReduxState) =>
        participant?.id ? getParticipantDisplayName(state, participant.id) : '');
    const shouldShowAvatar = shouldShowPiPAvatar(videoTrack);
    const avatarSize = Math.max(Math.round(windowHeight / 2), MIN_AVATAR_SIZE);

    /**
     * Hides the toolbar once the mouse has been idle for the legacy timeout,
     * re-arming the timer while the toolbar itself is hovered.
     */
    const scheduleToolbarHide = useCallback(() => {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (toolbarHoveredRef.current) {
                scheduleToolbarHide();

                return;
            }
            setToolbarVisible(false);
        }, TOOLBAR_TIMEOUT_MS);
    }, []);

    const onMouseMove = useCallback(() => {
        setToolbarVisible(true);
        scheduleToolbarHide();
    }, [ scheduleToolbarHide ]);

    const onToolbarMouseOver = useCallback(() => {
        toolbarHoveredRef.current = true;
    }, []);

    const onToolbarMouseOut = useCallback(() => {
        toolbarHoveredRef.current = false;
    }, []);

    useEffect(() => () => clearTimeout(hideTimerRef.current), []);

    useEffect(() => {
        const video = videoRef.current;

        if (!video || shouldShowAvatar || !videoTrack?.jitsiTrack) {
            return;
        }

        videoTrack.jitsiTrack.attach(video).catch((error: Error) => {
            logger.error('Failed to attach video track in Document PiP:', error);
        });

        return () => {
            try {
                videoTrack.jitsiTrack.detach(video);
            } catch (error) {
                logger.error('Failed to detach video track in Document PiP:', error);
            }
        };
    }, [ videoTrack, shouldShowAvatar ]);

    return (
        <div
            className = { classes.container }
            onMouseMove = { onMouseMove }>
            {shouldShowAvatar ? (
                <div className = { classes.avatarScreen }>
                    <div className = { classes.avatarContainer }>
                        <Avatar
                            participantId = { participant?.id }
                            size = { avatarSize } />
                    </div>
                    {participantName && <div className = { classes.displayName }>
                        { participantName }
                    </div>}
                </div>
            ) : (
                <video
                    autoPlay = { true }
                    className = { classes.videoElement }
                    muted = { true }
                    playsInline = { true }
                    ref = { videoRef } />
            )}
            <div
                className = { cx(classes.toolbar, toolbarVisible && classes.toolbarVisible) }
                onMouseOut = { onToolbarMouseOut }
                onMouseOver = { onToolbarMouseOver }>
                <AudioMuteButton
                    disableTooltip = { true }
                    registerKeyboardShortcut = { false } />
                <VideoMuteButton
                    disableTooltip = { true }
                    registerKeyboardShortcut = { false } />
                <HangupButton
                    customClass = 'hangup-button'
                    disableTooltip = { true } />
            </div>
        </div>
    );
}
