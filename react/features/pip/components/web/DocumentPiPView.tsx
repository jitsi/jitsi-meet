import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant, getParticipantDisplayName } from '../../../base/participants/functions';
import { isTrackStreamingStatusActive } from '../../../connection-indicator/functions';
import DisplayNameBadge from '../../../display-name/components/web/DisplayNameBadge';
import { getStageParticipantTypography } from '../../../display-name/components/web/styles';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isPrejoinPageVisible } from '../../../prejoin/functions.any';
import HangupButton from '../../../toolbox/components/HangupButton';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';
import { getPiPVideoTrack } from '../../functions';
import logger from '../../logger';

const useStyles = makeStyles<void, 'controls'>()((theme, _params, classes) => {
    return {
        container: {
            backgroundColor: theme.palette.largeVideoBackground,
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
        videoArea: {
            alignItems: 'center',
            backgroundColor: theme.palette.largeVideoBackground,
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',

            [`&:hover .${classes.controls}`]: {
                opacity: 1,
                pointerEvents: 'auto'
            }
        },
        videoElement: {
            backgroundColor: theme.palette.largeVideoBackground,
            height: '100%',
            objectFit: 'contain',
            width: '100%'
        },
        avatarPlaceholder: {
            alignItems: 'center',
            backgroundColor: theme.palette.largeVideoPlaceholder,
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            width: '100%'
        },
        floatingControls: {
            alignItems: 'center',
            bottom: theme.spacing(4),
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2),
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            width: '100%',
            zIndex: 10
        },
        participantName: {
            ...getStageParticipantTypography(theme),
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            width: '100%'
        },
        controls: {
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',

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
        }
    };
});

/**
 * Renders the participant video, avatar fallback, display name and controls inside the Document PiP window.
 *
 * @returns {React.ReactElement}
 */
export function DocumentPiPView() {
    const { classes, cx } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;
    const videoTrack = useSelector((state: IReduxState) => getPiPVideoTrack(state, participant));
    const participantName = useSelector((state: IReduxState) =>
        participant?.id ? getParticipantDisplayName(state, participant.id) : '');
    const shouldShowAvatar = !videoTrack
        || videoTrack.muted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));

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
        <div className = { classes.container }>
            <div className = { classes.videoArea }>
                {shouldShowAvatar ? (
                    <div className = { classes.avatarPlaceholder }>
                        <Avatar
                            participantId = { participant?.id }
                            size = { 120 } />
                    </div>
                ) : (
                    <video
                        autoPlay = { true }
                        className = { classes.videoElement }
                        muted = { true }
                        playsInline = { true }
                        ref = { videoRef } />
                )}
                <div className = { classes.floatingControls }>
                    {participantName && <div className = { classes.participantName }>
                        <DisplayNameBadge name = { participantName } />
                    </div>}
                    <div className = { cx(classes.controls, 'toolbox-content-items') }>
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
            </div>
        </div>
    );
}
