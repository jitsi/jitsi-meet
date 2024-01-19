import React, { Component } from 'react';
import { GestureResponderEvent, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    isTrackStreamingStatusActive,
    isTrackStreamingStatusInactive
} from '../../../connection-indicator/functions';
import SharedVideo from '../../../shared-video/components/native/SharedVideo';
import { IStateful } from '../../app/types';
import Avatar from '../../avatar/components/Avatar';
import { translate } from '../../i18n/functions';
import VideoTrack from '../../media/components/native/VideoTrack';
import { shouldRenderVideoTrack } from '../../media/functions';
import Container from '../../react/components/native/Container';
import { toState } from '../../redux/functions';
import { StyleType } from '../../styles/functions.any';
import TestHint from '../../testing/components/TestHint';
import { getVideoTrackByParticipant } from '../../tracks/functions';
import { ITrack } from '../../tracks/types';
import { getParticipantById, getParticipantDisplayName, isSharedVideoParticipant } from '../functions';

import styles from './styles';

/**
 * The type of the React {@link Component} props of {@link ParticipantView}.
 */
interface IProps {

    /**
     * Whether the connection is inactive or not.
     *
     * @private
     */
    _isConnectionInactive: boolean;

    /**
     * Whether the participant is a shared video participant.
     */
    _isSharedVideoParticipant: boolean;

    /**
     * The name of the participant which this component represents.
     *
     * @private
     */
    _participantName: string;

    /**
     * True if the video should be rendered, false otherwise.
     */
    _renderVideo: boolean;

    /**
     * The video Track of the participant with {@link #participantId}.
     */
    _videoTrack?: ITrack;

    /**
     * The avatar size.
     */
    avatarSize: number;

    /**
     * Whether video should be disabled for his view.
     */
    disableVideo?: boolean;

    /**
     * Callback to invoke when the {@code ParticipantView} is clicked/pressed.
     */
    onPress: (e?: GestureResponderEvent) => void;

    /**
     * The ID of the participant (to be) depicted by {@link ParticipantView}.
     *
     * @public
     */
    participantId: string;

    /**
     * The style, if any, to apply to {@link ParticipantView} in addition to its
     * default style.
     */
    style: StyleType;

    /**
     * The function to translate human-readable text.
     */
    t: Function;

    /**
     * The test hint id which can be used to locate the {@code ParticipantView}
     * on the jitsi-meet-torture side. If not provided, the
     * {@code participantId} with the following format will be used:
     * {@code `org.jitsi.meet.Participant#${participantId}`}.
     */
    testHintId?: string;

    /**
     * Indicates if the connectivity info label should be shown, if appropriate.
     * It will be shown in case the connection is interrupted.
     */
    useConnectivityInfoLabel: boolean;

    /**
     * The z-order of the {@link Video} of {@link ParticipantView} in the
     * stacking space of all {@code Video}s. For more details, refer to the
     * {@code zOrder} property of the {@code Video} class for React Native.
     */
    zOrder: number;

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled: boolean;
}

/**
 * Implements a React Component which depicts a specific participant's avatar
 * and video.
 *
 * @augments Component
 */
class ParticipantView extends Component<IProps> {

    /**
     * Renders the inactive connection status label.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderInactiveConnectionInfo() {
        const {
            avatarSize,
            _participantName: displayName,
            t
        } = this.props;

        // XXX Consider splitting this component into 2: one for the large view
        // and one for the thumbnail. Some of these don't apply to both.
        const containerStyle = {
            ...styles.connectionInfoContainer,
            width: avatarSize * 1.5
        };

        return (
            <View
                pointerEvents = 'box-none'
                style = { containerStyle as ViewStyle }>
                <Text style = { styles.connectionInfoText as TextStyle }>
                    { t('connection.LOW_BANDWIDTH', { displayName }) }
                </Text>
            </View>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isConnectionInactive,
            _isSharedVideoParticipant,
            _renderVideo: renderVideo,
            _videoTrack: videoTrack,
            disableVideo,
            onPress
        } = this.props;

        const testHintId
            = this.props.testHintId
                ? this.props.testHintId
                : `org.jitsi.meet.Participant#${this.props.participantId}`;

        const renderSharedVideo = _isSharedVideoParticipant && !disableVideo;

        return (
            <Container
                onClick = { renderVideo || renderSharedVideo ? undefined : onPress }
                style = {{
                    ...styles.participantView,
                    ...this.props.style
                }}
                touchFeedback = { false }>

                <TestHint
                    id = { testHintId }
                    onPress = { renderSharedVideo ? undefined : onPress }
                    value = '' />

                { renderSharedVideo && <SharedVideo /> }

                { renderVideo
                    && <VideoTrack
                        onPress = { onPress }
                        videoTrack = { videoTrack }
                        waitForVideoStarted = { false }
                        zOrder = { this.props.zOrder }
                        zoomEnabled = { this.props.zoomEnabled } /> }

                { !renderSharedVideo && !renderVideo
                    && <View style = { styles.avatarContainer as ViewStyle }>
                        <Avatar
                            participantId = { this.props.participantId }
                            size = { this.props.avatarSize } />
                    </View> }

                { _isConnectionInactive && this.props.useConnectivityInfoLabel
                    && this._renderInactiveConnectionInfo() }
            </Container>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@link ParticipantView}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The React {@code Component} props passed to the
 * associated (instance of) {@code ParticipantView}.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { disableVideo, participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    const videoTrack = getVideoTrackByParticipant(state, participant);

    return {
        _isConnectionInactive: isTrackStreamingStatusInactive(videoTrack),
        _isSharedVideoParticipant: isSharedVideoParticipant(participant),
        _participantName: getParticipantDisplayName(state, participantId),
        _renderVideo: shouldRenderParticipantVideo(state, participantId) && !disableVideo,
        _videoTrack: videoTrack
    };
}

/**
 * Returns true if the video of the participant should be rendered.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @param {string} id - The ID of the participant.
 * @returns {boolean}
 */
function shouldRenderParticipantVideo(stateful: IStateful, id: string) {
    const state = toState(stateful);
    const participant = getParticipantById(state, id);

    if (!participant) {
        return false;
    }

    /* First check if we have an unmuted video track. */
    const videoTrack = getVideoTrackByParticipant(state, participant);

    if (!videoTrack) {
        return false;
    }

    if (!shouldRenderVideoTrack(videoTrack, /* waitForVideoStarted */ false)) {
        return false;
    }

    /* Then check if the participant connection or track streaming status is active. */
    if (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack)) {
        return false;
    }

    /* Then check if audio-only mode is not active. */
    const audioOnly = state['features/base/audio-only'].enabled;

    if (!audioOnly) {
        return true;
    }

    /* Last, check if the participant is sharing their screen and they are on stage. */
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares || [];
    const largeVideoParticipantId = state['features/large-video'].participantId;
    const participantIsInLargeVideoWithScreen
        = participant.id === largeVideoParticipantId && remoteScreenShares.includes(participant.id);

    return participantIsInLargeVideoWithScreen;
}

export default translate(connect(_mapStateToProps)(ParticipantView));
