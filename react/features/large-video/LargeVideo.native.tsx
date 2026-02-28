import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import ParticipantView from '../../base/participants/components/ParticipantView.native';
import {
    getParticipantById,
    isLocalScreenshareParticipant
} from '../../base/participants/functions';
import {
    getVideoTrackByParticipant,
    isLocalVideoTrackDesktop
} from '../../base/tracks/functions.native';
import { AVATAR_SIZE } from './styles';
import { useTrackStreamingStatus } from './useTrackStreamingStatus.native';

interface IProps {
    onClick?: Function;
}

function calculateDisplaySettings(height: number, width: number) {
    const shortestSide = Math.min(height, width);
    const rounded = 2 * Math.round(shortestSide / 2);

    if (rounded < AVATAR_SIZE * 1.5) {
        return {
            avatarSize: rounded - 15,
            useConnectivityInfoLabel: false
        };
    }

    return {
        avatarSize: AVATAR_SIZE,
        useConnectivityInfoLabel: true
    };
}

function LargeVideo({ onClick }: IProps): JSX.Element {
    const {
        participantId,
        height,
        width,
        disableVideo,
        videoTrack
    } = useSelector((state: IReduxState) => {
        const { participantId: pid } = state['features/large-video'];
        const participant = getParticipantById(state, pid ?? '');

        const { clientHeight, clientWidth } =
            state['features/base/responsive-ui'];

        const vTrack = getVideoTrackByParticipant(state, participant);

        let disable = false;

        if (isLocalScreenshareParticipant(participant)) {
            disable = true;
        } else if (participant?.local) {
            disable = isLocalVideoTrackDesktop(state);
        }

        return {
            participantId: pid ?? '',
            height: clientHeight,
            width: clientWidth,
            disableVideo: disable,
            videoTrack: vTrack
        };
    });

    useTrackStreamingStatus(videoTrack);

    const { avatarSize, useConnectivityInfoLabel } = useMemo(() => {
        return calculateDisplaySettings(height, width);
    }, [height, width]);

    return (
        <ParticipantView
            avatarSize={avatarSize}
            disableVideo={disableVideo}
            onPress={onClick}
            participantId={participantId}
            testHintId="org.jitsi.meet.LargeVideo"
            useConnectivityInfoLabel={useConnectivityInfoLabel}
            zOrder={0}
            zoomEnabled={true}
        />
    );
}

export default LargeVideo;

