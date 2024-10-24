import React, { Component } from 'react';
import { GestureResponderEvent, Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isTrackStreamingStatusInactive } from '../../../connection-indicator/functions';
import SharedVideo from '../../../shared-video/components/native/SharedVideo';
import { isSharedVideoEnabled } from '../../../shared-video/functions';
import Avatar from '../../avatar/components/Avatar';
import { translate } from '../../i18n/functions';
import VideoTrack from '../../media/components/native/VideoTrack';
import Container from '../../react/components/native/Container';
import { StyleType } from '../../styles/functions.any';
import TestHint from '../../testing/components/TestHint';
import { getVideoTrackByParticipant } from '../../tracks/functions.native';
import { ITrack } from '../../tracks/types';
import {
    getParticipantById,
    getParticipantDisplayName,
    isSharedVideoParticipant,
    shouldRenderParticipantVideo
} from '../functions';
import { FakeParticipant } from '../types';

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
     * Whether the shared video is enabled or not.
     */
    _sharedVideoEnabled: boolean;

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
    disableVideo?: boolean | FakeParticipant;

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

    _renderParticipantAvatar() {
        const { avatarSize, participantId } = this.props;

        return (
            <View style = { styles.avatarContainer as ViewStyle }>
                <Avatar
                    participantId = { participantId }
                    size = { avatarSize } />
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
            _sharedVideoEnabled,
            _videoTrack: videoTrack,
            avatarSize,
            disableVideo,
            onPress,
            participantId,
            style,
            testHintId: testHintIdProp,
            useConnectivityInfoLabel,
            zOrder,
            zoomEnabled
        } = this.props;

        const testHintId
            = testHintIdProp
                ? testHintIdProp
                : `org.jitsi.meet.Participant#${participantId}`;

        const renderSharedVideo = _isSharedVideoParticipant && !disableVideo && _sharedVideoEnabled;

        return (
            <Container
                onClick = { renderVideo || renderSharedVideo ? undefined : onPress }
                style = {{
                    ...styles.participantView,
                    ...style
                }}
                touchFeedback = { false }>

                <TestHint
                    id = { testHintId }
                    onPress = { renderSharedVideo ? undefined : onPress }
                    value = '' />

                { renderSharedVideo && <SharedVideo /> }

                <VideoTrack
                    avatarSize = { avatarSize }
                    fallbackView = { this._renderParticipantAvatar() }
                    onPress = { onPress }
                    participantId = { participantId }
                    videoTrack = { videoTrack }
                    waitForVideoStarted = { false }
                    zOrder = { zOrder }
                    zoomEnabled = { zoomEnabled } />

                { _isConnectionInactive && useConnectivityInfoLabel
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
        _sharedVideoEnabled: isSharedVideoEnabled(state),
        _videoTrack: videoTrack
    };
}

export default translate(connect(_mapStateToProps)(ParticipantView));
