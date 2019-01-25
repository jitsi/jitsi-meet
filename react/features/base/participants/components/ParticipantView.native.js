// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { connect } from 'react-redux';

import { translate } from '../../i18n';
import { JitsiParticipantConnectionStatus } from '../../lib-jitsi-meet';
import {
    MEDIA_TYPE,
    VideoTrack
} from '../../media';
import { Container, TintedView } from '../../react';
import { TestHint } from '../../testing/components';
import { getTrackByMediaTypeAndParticipant } from '../../tracks';

import Avatar from './Avatar';
import {
    getAvatarURL,
    getParticipantById,
    getParticipantDisplayName,
    shouldRenderParticipantVideo
} from '../functions';
import styles from './styles';

/**
 * The type of the React {@link Component} props of {@link ParticipantView}.
 */
type Props = {

    /**
     * The source (e.g. URI, URL) of the avatar image of the participant with
     * {@link #participantId}.
     *
     * @private
     */
    _avatar: string,

    /**
     * The connection status of the participant. Her video will only be rendered
     * if the connection status is 'active'; otherwise, the avatar will be
     * rendered. If undefined, 'active' is presumed.
     *
     * @private
     */
    _connectionStatus: string,

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
     * If true, a tinting will be applied to the view, regardless of video or
     * avatar is rendered.
     */
    tintEnabled: boolean,

    /**
     * The test hint id which can be used to locate the {@code ParticipantView}
     * on the jitsi-meet-torture side. If not provided, the
     * {@code participantId} with the following format will be used:
     * {@code `org.jitsi.meet.Participant#${participantId}`}
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
 * @extends Component
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
        case JitsiParticipantConnectionStatus.INTERRUPTED:
            messageKey = 'connection.USER_CONNECTION_INTERRUPTED';
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
            onPress,
            _avatar: avatar,
            _connectionStatus: connectionStatus,
            _renderVideo: renderVideo,
            _videoTrack: videoTrack
        } = this.props;

        const waitForVideoStarted = false;

        // Is the avatar to be rendered?
        const renderAvatar = Boolean(!renderVideo && avatar);

        // If the connection has problems, we will "tint" the video / avatar.
        const useTint
            = connectionStatus !== JitsiParticipantConnectionStatus.ACTIVE
                || this.props.tintEnabled;

        const testHintId
            = this.props.testHintId
                ? this.props.testHintId
                : `org.jitsi.meet.Participant#${this.props.participantId}`;

        return (
            <Container
                onClick = { renderVideo ? undefined : onPress }
                style = {{
                    ...styles.participantView,
                    ...this.props.style
                }}
                touchFeedback = { false }>

                <TestHint
                    id = { testHintId }
                    onPress = { onPress }
                    value = '' />

                { renderVideo
                    && <VideoTrack
                        onPress = { onPress }
                        videoTrack = { videoTrack }
                        waitForVideoStarted = { waitForVideoStarted }
                        zOrder = { this.props.zOrder }
                        zoomEnabled = { this.props.zoomEnabled } /> }

                { renderAvatar
                    && <Avatar
                        size = { this.props.avatarSize }
                        uri = { avatar } /> }

                { useTint

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
 * @returns {{
 *     _avatar: string,
 *     _connectionStatus: string,
 *     _participantName: string,
 *     _renderVideo: boolean,
 *     _videoTrack: Track
 * }}
 */
function _mapStateToProps(state, ownProps) {
    const { participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    let avatar;
    let connectionStatus;
    let participantName;

    if (participant) {
        avatar = getAvatarURL(participant);
        connectionStatus = participant.connectionStatus;
        participantName = getParticipantDisplayName(state, participant.id);

        // Avatar (on React Native) now has the ability to generate an
        // automatically-colored default image when no URI/URL is specified or
        // when it fails to load. In order to make the coloring permanent(ish)
        // per participant, Avatar will need something permanent(ish) per
        // perticipant, obviously. A participant's ID is such a piece of data.
        // But the local participant changes her ID as she joins, leaves.
        // TODO @lyubomir: The participants may change their avatar URLs at
        // runtime which means that, if their old and new avatar URLs fail to
        // download, Avatar will change their automatically-generated colors.
        avatar || participant.local || (avatar = `#${participant.id}`);

        // ParticipantView knows before Avatar that an avatar URL will be used
        // so it's advisable to prefetch here.
        avatar && !avatar.startsWith('#')
            && FastImage.preload([ { uri: avatar } ]);
    }

    return {
        _avatar: avatar,
        _connectionStatus:
            connectionStatus
                || JitsiParticipantConnectionStatus.ACTIVE,
        _participantName: participantName,
        _renderVideo: shouldRenderParticipantVideo(state, participantId),
        _videoTrack:
            getTrackByMediaTypeAndParticipant(
                state['features/base/tracks'],
                MEDIA_TYPE.VIDEO,
                participantId)
    };
}

export default translate(connect(_mapStateToProps)(ParticipantView));
