import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import ParticipantView from '../../base/participants/components/ParticipantView.native';
import { getParticipantById, isLocalScreenshareParticipant } from '../../base/participants/functions';
import { getVideoTrackByParticipant, isLocalVideoTrackDesktop } from '../../base/tracks/functions.native';
import { ITrack } from '../../base/tracks/types';
import { useTrackStreamingStatus } from '../hooks/useTrackStreamingStatus';

import { AVATAR_SIZE } from './styles';

/**
 * The type of the React {@link Component} props of {@link LargeVideo}.
 */
interface IProps {

    /**
     * Whether video should be disabled.
     */
    _disableVideo: boolean;

    /**
     * Application's viewport height.
     */
    _height: number;

    /**
     * The ID of the participant (to be) depicted by LargeVideo.
     *
     * @private
     */
    _participantId: string;

    /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack?: ITrack;

    /**
     * Application's viewport height.
     */
    _width: number;

    /**
     * Invoked to trigger state changes in Redux.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback to invoke when the {@code LargeVideo} is clicked/pressed.
     */
    onClick?: Function;
}

/**
 * Implements a React function component which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on mobile/React Native.
 *
 * @param {IProps} props - The component props.
 * @returns {JSX.Element} The LargeVideo component.
 */
const LargeVideo: React.FC<IProps> = ({
    _disableVideo,
    _height,
    _participantId,
    _videoTrack,
    _width,
    onClick
}) => {
    // Use custom hook to manage track streaming status
    useTrackStreamingStatus(_videoTrack);

    // Calculate avatar size and connectivity label based on available dimensions
    const { avatarSize, useConnectivityInfoLabel } = useMemo(() => {
        // Get the size, rounded to the nearest even number.
        const size = 2 * Math.round(Math.min(_height, _width) / 2);

        if (size < AVATAR_SIZE * 1.5) {
            return {
                avatarSize: size - 15, // Leave some margin.
                useConnectivityInfoLabel: false
            };
        }

        return {
            avatarSize: AVATAR_SIZE,
            useConnectivityInfoLabel: true
        };
    }, [ _height, _width ]);

    return (
        <ParticipantView
            avatarSize = { avatarSize }
            disableVideo = { _disableVideo }
            onPress = { onClick }
            participantId = { _participantId }
            testHintId = 'org.jitsi.meet.LargeVideo'
            useConnectivityInfoLabel = { useConnectivityInfoLabel }
            zOrder = { 0 }
            zoomEnabled = { true } />
    );
};

/**
 * Maps (parts of) the Redux state to the associated LargeVideo's props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { participantId } = state['features/large-video'];
    const participant = getParticipantById(state, participantId ?? '');
    const { clientHeight: height, clientWidth: width } = state['features/base/responsive-ui'];
    const videoTrack = getVideoTrackByParticipant(state, participant);
    let disableVideo = false;

    if (isLocalScreenshareParticipant(participant)) {
        disableVideo = true;
    } else if (participant?.local) {
        disableVideo = isLocalVideoTrackDesktop(state);
    }

    return {
        _disableVideo: disableVideo,
        _height: height,
        _participantId: participantId ?? '',
        _videoTrack: videoTrack,
        _width: width
    };
}

export default connect(_mapStateToProps)(LargeVideo);
