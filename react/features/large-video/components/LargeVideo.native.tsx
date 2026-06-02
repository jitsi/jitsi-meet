import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import ParticipantView from '../../base/participants/components/ParticipantView.native';
import { getParticipantById, isLocalScreenshareParticipant } from '../../base/participants/functions';
import { getVideoTrackByParticipant, isLocalVideoTrackDesktop } from '../../base/tracks/functions.native';
import { useTrackStreamingStatus } from '../../base/tracks/hooks.any';
import { ITrack } from '../../base/tracks/types';

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
 * The type of the React {@link Component} state of {@link LargeVideo}.
 */
interface IState {

    /**
     * Size for the Avatar. It will be dynamically adjusted based on the
     * available size.
     */
    avatarSize: number;

    /**
     * Whether the connectivity indicator will be shown or not. It will be true
     * by default, but it may be turned off if there is not enough space.
     */
    useConnectivityInfoLabel: boolean;
}

const DEFAULT_STATE = {
    avatarSize: AVATAR_SIZE,
    useConnectivityInfoLabel: true
};

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on mobile/React Native.
 *
 * @augments Component
 */
class LargeVideo extends PureComponent<IProps, IState> {
    /**
     * Creates new LargeVideo component.
     *
     * @param {IProps} props - The props of the component.
     * @returns {LargeVideo}
     */
    state = {
        ...DEFAULT_STATE
    };

    /**
     * Handles dimension changes. In case we deem it's too
     * small, the connectivity indicator won't be rendered and the avatar
     * will occupy the entirety of the available screen state.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps) {
        const { _height, _width } = props;

        // Get the size, rounded to the nearest even number.
        const size = 2 * Math.round(Math.min(_height, _width) / 2);

        if (size < AVATAR_SIZE * 1.5) {
            return {
                avatarSize: size - 15, // Leave some margin.
                useConnectivityInfoLabel: false
            };
        }

        return DEFAULT_STATE;

    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            avatarSize,
            useConnectivityInfoLabel
        } = this.state;
        const {
            _disableVideo,
            _participantId,
            onClick
        } = this.props;

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
    }
}

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

export default connect(_mapStateToProps)((props: IProps) => {
    useTrackStreamingStatus(props._videoTrack);

    return <LargeVideo { ...props } />;
});
