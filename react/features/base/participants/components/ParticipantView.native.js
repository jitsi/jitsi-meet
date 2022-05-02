// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { SharedVideo } from '../../../shared-video/components/native';
import { Avatar } from '../../avatar';
import { translate } from '../../i18n';
import { JitsiParticipantConnectionStatus } from '../../lib-jitsi-meet';
import {
    MEDIA_TYPE,
    VideoTrack
} from '../../media';
import { Container, TintedView } from '../../react';
import { connect } from '../../redux';
import { TestHint } from '../../testing/components';
import { getTrackByMediaTypeAndParticipant } from '../../tracks';
import { shouldRenderParticipantVideo, getParticipantById } from '../functions';

import styles from './styles';

/**
 * The type of the React {@link Component} props of {@link ParticipantView}.
 */
type Props = {

    /**
     * The connection status of the participant. Her video will only be rendered
     * if the connection status is 'active'; otherwise, the avatar will be
     * rendered. If undefined, 'active' is presumed.
     *
     * @private
     */
    _connectionStatus: string,

    /**
     * True if the participant which this component represents is fake.
     *
     * @private
     */
    _isFakeParticipant: boolean,

    /**
     * The name of the participant which this component represents.
     *
     * @private
     */
    _participantName: string,

    /**
     * True if the video should be rendered, false otherwise.
     */
    _renderVideo: boolean,

    /**
     * The video Track of the participant with {@link #participantId}.
     */
    _videoTrack: Object,

    /**
     * The avatar size.
     */
    avatarSize: number,

    /**
     * Whether video should be disabled for his view.
     */
    disableVideo: ?boolean,

    /**
     * Callback to invoke when the {@code ParticipantView} is clicked/pressed.
     */
    onPress: Function,

    /**
     * The ID of the participant (to be) depicted by {@link ParticipantView}.
     *
     * @public
     */
    participantId: string,

    /**
     * The style, if any, to apply to {@link ParticipantView} in addition to its
     * default style.
     */
    style: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function,

    /**
     * The test hint id which can be used to locate the {@code ParticipantView}
     * on the jitsi-meet-torture side. If not provided, the
     * {@code participantId} with the following format will be used:
     * {@code `org.jitsi.meet.Participant#${participantId}`}.
     */
    testHintId: ?string,

    /**
     * Indicates if the connectivity info label should be shown, if appropriate.
     * It will be shown in case the connection is interrupted.
     */
    useConnectivityInfoLabel: boolean,

    /**
     * The z-order of the {@link Video} of {@link ParticipantView} in the
     * stacking space of all {@code Video}s. For more details, refer to the
     * {@code zOrder} property of the {@code Video} class for React Native.
     */
    zOrder: number,

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled: boolean
};

/**
 * Implements a React Component which depicts a specific participant's avatar
 * and video.
 *
 * @augments Component
 */
class ParticipantView extends Component<Props> {

    /**
     * Renders the connection status label, if appropriate.
     *
     * @param {string} connectionStatus - The status of the participant's
     * connection.
     * @private
     * @returns {ReactElement|null}
     */
    _renderConnectionInfo(connectionStatus) {
        let messageKey;

        switch (connectionStatus) {
        case JitsiParticipantConnectionStatus.INACTIVE:
            messageKey = 'connection.LOW_BANDWIDTH';
            break;
        default:
            return null;
        }

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
                style = { containerStyle }>
                <Text style = { styles.connectionInfoText }>
                    { t(messageKey, { displayName }) }
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
            _connectionStatus: connectionStatus,
            _isFakeParticipant,
            _renderVideo: renderVideo,
            _videoTrack: videoTrack,
            disableVideo,
            onPress
        } = this.props;

        // If the connection has problems, we will "tint" the video / avatar.
        const connectionProblem
            = connectionStatus !== JitsiParticipantConnectionStatus.ACTIVE;

        const testHintId
            = this.props.testHintId
                ? this.props.testHintId
                : `org.jitsi.meet.Participant#${this.props.participantId}`;

        const renderSharedVideo = _isFakeParticipant && !disableVideo;

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

                { !_isFakeParticipant && renderVideo
                    && <VideoTrack
                        onPress = { onPress }
                        videoTrack = { videoTrack }
                        waitForVideoStarted = { false }
                        zOrder = { this.props.zOrder }
                        zoomEnabled = { this.props.zoomEnabled } /> }

                { !renderSharedVideo && !renderVideo
                    && <View style = { styles.avatarContainer }>
                        <Avatar
                            participantId = { this.props.participantId }
                            size = { this.props.avatarSize } />
                    </View> }

                { connectionProblem

                    // If the connection has problems, tint the video / avatar.
                    && <TintedView /> }

                { this.props.useConnectivityInfoLabel
                    && this._renderConnectionInfo(connectionStatus) }
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
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { disableVideo, participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    let connectionStatus;
    let participantName;

    return {
        _connectionStatus:
            connectionStatus
                || JitsiParticipantConnectionStatus.ACTIVE,
        _isFakeParticipant: participant && participant.isFakeParticipant,
        _participantName: participantName,
        _renderVideo: shouldRenderParticipantVideo(state, participantId) && !disableVideo,
        _videoTrack:
            getTrackByMediaTypeAndParticipant(
                state['features/base/tracks'],
                MEDIA_TYPE.VIDEO,
                participantId)
    };
}

export default translate(connect(_mapStateToProps)(ParticipantView));
