import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import Avatar from '../../base/avatar/components/Avatar';
import {
    getParticipantById,
    getParticipantDisplayName,
    isScreenShareParticipantById
} from '../../base/participants/functions';
import { getVideoTrackByParticipant } from '../../base/tracks/functions.any';

import SecondScreenVideo from './SecondScreenVideo';

/**
 * The type of the React {@code Component} props of {@link SecondScreenTile}.
 */
interface IProps {

    /**
     * The tile height in pixels.
     */
    height: number;

    /**
     * Whether this participant is the dominant speaker (drives the speaking ring).
     */
    isActiveSpeaker: boolean;

    /**
     * The id of the participant (a person or a virtual screenshare) this tile
     * previews.
     */
    participantId: string;

    /**
     * The tile width in pixels.
     */
    width: number;

    /**
     * The second-screen window, needed to render a track in its own realm.
     */
    win: Window;
}

/**
 * The styles, injected into the second window via its own Emotion cache (see
 * {@code SecondScreenPortals}). The dominant-speaker ring colour matches the main
 * window's thumbnail indicator (Jitsi's action01 token).
 */
const useStyles = makeStyles()(() => {
    return {
        tile: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            backgroundColor: '#292929',
            border: '3px solid transparent',
            borderRadius: 4,
            overflow: 'hidden',
            transition: 'border-color 0.2s ease'
        },
        speaking: {
            borderColor: '#4687ED'
        },
        avatar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        bottom: {
            position: 'absolute',
            bottom: 6,
            left: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            maxWidth: 'calc(100% - 12px)',
            padding: '3px 6px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 4,
            color: '#fff'
        },
        name: {
            minWidth: 0,
            fontSize: 12,
            lineHeight: '16px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    };
});

/**
 * Renders one participant's tile: their camera or shared screen (via the
 * realm-safe {@link SecondScreenVideo} clone leaf) or their avatar, with their
 * name and a dominant-speaker ring. Used both as a gallery cell and inside a
 * stage filmstrip button. Memoized so a dominant-speaker change only re-renders
 * the tiles whose ring flips.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenTile = ({ height, isActiveSpeaker, participantId, width, win }: IProps) => {
    const { classes, cx } = useStyles();
    const name = useSelector((state: IReduxState) => getParticipantDisplayName(state, participantId));
    const isScreenshare = useSelector((state: IReduxState) => isScreenShareParticipantById(state, participantId));
    const videoTrack = useSelector(
        (state: IReduxState) => getVideoTrackByParticipant(state, getParticipantById(state, participantId)));
    const track = videoTrack?.jitsiTrack && !videoTrack.muted
        ? (videoTrack.jitsiTrack.getTrack() as MediaStreamTrack) ?? null
        : null;

    const avatarSize = Math.max(24, Math.floor(Math.min(height / 2, width - 30, 150)));

    return (
        <div
            className = { cx(classes.tile, isActiveSpeaker && classes.speaking) }
            style = {{ height: `${height}px`, width: `${width}px` }}>
            { track ? (
                <SecondScreenVideo
                    fit = { isScreenshare ? 'contain' : 'cover' }
                    track = { track }
                    win = { win } />
            ) : (
                <div className = { classes.avatar }>
                    <Avatar
                        participantId = { participantId }
                        size = { avatarSize } />
                </div>
            ) }
            <div className = { classes.bottom }>
                <span className = { classes.name }>
                    { name }
                </span>
            </div>
        </div>
    );
};

export default React.memo(SecondScreenTile);
