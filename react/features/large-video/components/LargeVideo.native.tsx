import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { JitsiTrackEvents } from '../../base/lib-jitsi-meet';
import ParticipantView from '../../base/participants/components/ParticipantView.native';
import { getParticipantById, isLocalScreenshareParticipant } from '../../base/participants/functions';
import { trackStreamingStatusChanged } from '../../base/tracks/actions.native';
import { getVideoTrackByParticipant, isLocalVideoTrackDesktop } from '../../base/tracks/functions.native';
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
    constructor(props: IProps) {
        super(props);

        this.handleTrackStreamingStatusChanged = this.handleTrackStreamingStatusChanged.bind(this);
    }

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
     * Starts listening for track streaming status updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        // Listen to track streaming status changed event to keep it updated.
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Stops listening for track streaming status updates on the old track and starts listening instead on the new
     * track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (prevProps._videoTrack?.jitsiTrack?.getSourceName() !== _videoTrack?.jitsiTrack?.getSourceName()) {
            if (prevProps._videoTrack && !prevProps._videoTrack.local) {
                prevProps._videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(prevProps._videoTrack.jitsiTrack,
                    prevProps._videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
            if (_videoTrack && !_videoTrack.local) {
                _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                    _videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
        }
    }

    /**
     * Remove listeners for track streaming status update.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Handle track streaming status change event by by dispatching an action to update track streaming status for the
     * given track in app state.
     *
     * @param {JitsiTrack} jitsiTrack - The track with streaming status updated.
     * @param {JitsiTrackStreamingStatus} streamingStatus - The updated track streaming status.
     * @returns {void}
     */
    handleTrackStreamingStatusChanged(jitsiTrack: any, streamingStatus: string) {
        this.props.dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
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

export default connect(_mapStateToProps)(LargeVideo);
