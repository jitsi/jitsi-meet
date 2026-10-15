import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant, getParticipantDisplayName } from '../../../base/participants/functions';
import { getDisplayNameColor } from '../../../display-name/components/web/styles';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isPrejoinPageVisible } from '../../../prejoin/functions.any';
import HangupButton from '../../../toolbox/components/HangupButton';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';
import { getPiPVideoTrack, shouldShowPiPAvatar } from '../../functions';
import logger from '../../logger';

/**
 * Time without mouse movement after which the toolbar fades out; matches the
 * legacy always-on-top window.
 */
const TOOLBAR_TIMEOUT_MS = 4000;

/**
 * Size of the compact toolbar buttons and of their icons; the size the main
 * toolbar itself switches to on tiny viewports. The full-size buttons would
 * cover a third of the default 320x180 window.
 */
const TOOLBAR_BUTTON_SIZE = 36;
const TOOLBAR_ICON_SIZE = 22;

/**
 * Avatar sizing shared with the filmstrip thumbnail: half of the height, with
 * room for a horizontal margin, capped at the size of the stage avatar.
 */
const MAX_AVATAR_SIZE = 200;
const AVATAR_HORIZONTAL_MARGIN = 30;

/**
 * Smallest avatar rendered while the window size is not known yet.
 */
const MIN_AVATAR_SIZE = 40;

const useStyles = makeStyles()(theme => {
    return {
        // The window is a floating thumbnail of the stage participant, so it
        // takes the thumbnail's background and custom themes apply to it too.
        container: {
            backgroundColor: theme.palette.thumbnailBackground,
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
            backgroundColor: theme.palette.thumbnailBackground,
            display: 'block',
            height: '100%',
            objectFit: 'contain',
            width: '100%'
        },

        // The legacy avatar screen: the avatar takes half of the window height
        // and sits a quarter of the height from the top, with the display name
        // right underneath - the only place the name is ever shown. The name
        // uses the thumbnail's display name typography and color.
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
            ...theme.typography.labelBold,
            color: getDisplayNameColor(theme),
            marginTop: theme.spacing(2),
            overflow: 'hidden',
            padding: `0 ${theme.spacing(2)}`,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        },

        // The legacy compact toolbar placement: a pill at the bottom center
        // that appears on mouse movement and fades out when idle. Colors and
        // shape are the main toolbar's, through the toolbox-content-items
        // class; only the sizes are overridden here, nested under that class
        // where needed to take precedence over its global rules.
        toolbar: {
            bottom: '10px',
            left: '50%',
            opacity: 0,
            position: 'absolute',
            transform: 'translateX(-50%)',
            transition: 'opacity 0.3s ease',
            zIndex: 10,

            '&.toolbox-content-items': {
                padding: '3px',
                pointerEvents: 'none'
            },

            '& .toolbox-icon': {
                height: `${TOOLBAR_BUTTON_SIZE}px`,
                padding: `${(TOOLBAR_BUTTON_SIZE - TOOLBAR_ICON_SIZE) / 2}px`,
                width: `${TOOLBAR_BUTTON_SIZE}px`,

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
            '&.toolbox-content-items': {
                opacity: 1,
                pointerEvents: 'auto'
            }
        }
    };
});

/**
 * The inner size of the PiP window in CSS pixels.
 */
interface IWindowSize {
    height: number;
    width: number;
}

/**
 * Tracks the inner size of the PiP window so the avatar can be sized relative
 * to it, like the filmstrip thumbnail sizes its avatar.
 *
 * @param {Window | null} pipWindow - The PiP window.
 * @returns {IWindowSize} The window's inner size; zero until it is known.
 */
function usePiPWindowSize(pipWindow: Window | null): IWindowSize {
    const [ size, setSize ] = useState<IWindowSize>({
        height: pipWindow?.innerHeight ?? 0,
        width: pipWindow?.innerWidth ?? 0
    });

    useEffect(() => {
        if (!pipWindow) {
            return;
        }

        const update = () => setSize({
            height: pipWindow.innerHeight,
            width: pipWindow.innerWidth
        });

        update();
        pipWindow.addEventListener('resize', update);

        return () => {
            pipWindow.removeEventListener('resize', update);
        };
    }, [ pipWindow ]);

    return size;
}

/**
 * Renders the participant video or avatar and the compact controls inside the PiP window, laid out
 * like the legacy always-on-top window: video fills the window with no overlays, the avatar screen
 * shows the avatar with the display name underneath, and the toolbar fades in on mouse movement.
 * Colors and shapes come from the theme, like the filmstrip thumbnail and the main toolbar.
 * Shared by the browser's Document PiP window and the custom Electron PiP window.
 *
 * @returns {React.ReactElement}
 */
export function PiPView() {
    const { classes, cx } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const toolbarHoveredRef = useRef(false);
    const [ toolbarVisible, setToolbarVisible ] = useState(false);
    const pipWindow = useSelector((state: IReduxState) => state['features/pip'].pipWindow);
    const { height: windowHeight, width: windowWidth } = usePiPWindowSize(pipWindow);
    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;
    const videoTrack = useSelector((state: IReduxState) => getPiPVideoTrack(state, participant));
    const participantName = useSelector((state: IReduxState) =>
        participant?.id ? getParticipantDisplayName(state, participant.id) : '');
    const shouldShowAvatar = shouldShowPiPAvatar(videoTrack);
    const avatarSize = windowHeight
        ? Math.round(Math.min(windowHeight / 2, windowWidth - AVATAR_HORIZONTAL_MARGIN, MAX_AVATAR_SIZE))
        : MIN_AVATAR_SIZE;

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
                className = { cx('toolbox-content-items', classes.toolbar, toolbarVisible && classes.toolbarVisible) }
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
