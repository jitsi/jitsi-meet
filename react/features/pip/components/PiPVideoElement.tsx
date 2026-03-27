import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getAvatarFont, getAvatarInitialsColor } from '../../base/avatar/components/web/styles';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { ITrack } from '../../base/tracks/types';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { getDisplayNameColor } from '../../display-name/components/web/styles';
import { getThumbnailBackgroundColor } from '../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { isPrejoinPageVisible } from '../../prejoin/functions.any';
import { getPiPVideoTrack } from '../functions';
import {
    useCanvasAvatar,
    usePiPBrowserEvents,
    usePiPVideoSource,
    usePiPWindowLifecycle
} from '../hooks';

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
 * This will Automatically switches between real video track and canvas-based avatar
 * depending on video availability.
 *
 * @returns {JSX.Element} The hidden video element.
 */
const PiPVideoElement: React.FC = () => {
    const { classes, theme } = useStyles();
    const videoRef = useRef<HTMLVideoElement>(null);
    const previousTrackRef = useRef<ITrack | undefined>(undefined);

    // Redux selectors.
    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector(getLocalParticipant);
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;

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
    const shouldShowAvatar = !videoTrack
        || videoTrack.muted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));

    usePiPVideoSource(videoRef, previousTrackRef, videoTrack, shouldShowAvatar, canvasStreamRef);
    usePiPWindowLifecycle(videoRef, dispatch);
    usePiPBrowserEvents(videoRef, dispatch);

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
