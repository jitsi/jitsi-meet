import React, { Component } from 'react';
import { connect } from 'react-redux';

import { JitsiParticipantConnectionStatus } from '../../lib-jitsi-meet';
import { prefetch } from '../../../mobile/image-cache';
import {
    MEDIA_TYPE,
    shouldRenderVideoTrack,
    VideoTrack
} from '../../media';
import { Container } from '../../react';
import { getTrackByMediaTypeAndParticipant } from '../../tracks';

import Avatar from './Avatar';
import { getAvatarURL, getParticipantById } from '../functions';
import styles from './styles';

/**
 * Implements a React Component which depicts a specific participant's avatar
 * and video.
 *
 * @extends Component
 */
class ParticipantView extends Component {
    /**
     * ParticipantView component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The indicator which determines whether conferencing is in audio-only
         * mode.
         *
         * @private
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * The source (e.g. URI, URL) of the avatar image of the participant
         * with {@link #participantId}.
         *
         * @private
         */
        _avatar: React.PropTypes.string,

        /**
         * The connection status of the participant. Her video will only be
         * rendered if the connection status is 'active'; otherwise, the avatar
         * will be rendered. If undefined, 'active' is presumed.
         *
         * @private
         */
        _connectionStatus: React.PropTypes.string,

        /**
         * The video Track of the participant with {@link #participantId}.
         */
        _videoTrack: React.PropTypes.object,

        /**
         * The style, if any, of the avatar in addition to the default style.
         */
        avatarStyle: React.PropTypes.object,

        /**
         * The ID of the participant (to be) depicted by ParticipantView.
         *
         * @public
         */
        participantId: React.PropTypes.string,

        /**
         * True if the avatar of the depicted participant is to be shown should
         * the avatar be available and the video of the participant is not to be
         * shown; otherwise, false. If undefined, defaults to true.
         */
        showAvatar: React.PropTypes.bool,

        /**
         * True if the video of the depicted participant is to be shown should
         * the video be available. If undefined, defaults to true.
         */
        showVideo: React.PropTypes.bool,

        /**
         * The style, if any, to apply to ParticipantView in addition to its
         * default style.
         */
        style: React.PropTypes.object,

        /**
         * The z-order of the Video of ParticipantView in the stacking space of
         * all Videos. For more details, refer to the zOrder property of the
         * Video class for React Native.
         */
        zOrder: React.PropTypes.number
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _avatar: avatar,
            _connectionStatus: connectionStatus,
            _videoTrack: videoTrack
        } = this.props;

        // Is the video to be rendered?
        // FIXME It's currently impossible to have true as the value of
        // waitForVideoStarted because videoTrack's state videoStarted will be
        // updated only after videoTrack is rendered.
        const waitForVideoStarted = false;
        const renderVideo
            = !this.props._audioOnly
                && (connectionStatus
                    === JitsiParticipantConnectionStatus.ACTIVE)
                && shouldRenderVideoTrack(videoTrack, waitForVideoStarted);

        // Is the avatar to be rendered?
        const renderAvatar = Boolean(!renderVideo && avatar);

        return (
            <Container
                style = {{
                    ...styles.participantView,
                    ...this.props.style
                }}>

                { renderVideo

                    // The consumer of this ParticipantView is allowed to forbid
                    // showing the video if the private logic of this
                    // ParticipantView determines that the video could be
                    // rendered.
                    && _toBoolean(this.props.showVideo, true)
                    && <VideoTrack
                        videoTrack = { videoTrack }
                        waitForVideoStarted = { waitForVideoStarted }
                        zOrder = { this.props.zOrder } /> }

                { renderAvatar

                    // The consumer of this ParticipantView is allowed to forbid
                    // showing the avatar if the private logic of this
                    // ParticipantView determines that the avatar could be
                    // rendered.
                    && _toBoolean(this.props.showAvatar, true)
                    && <Avatar
                        style = { this.props.avatarStyle }
                        uri = { avatar } /> }
            </Container>
        );
    }
}

/**
 * Converts the specified value to a boolean value. If the specified value is
 * undefined, returns the boolean value of undefinedValue.
 *
 * @param {any} value - The value to convert to a boolean value should it not be
 * undefined.
 * @param {any} undefinedValue - The value to convert to a boolean value should
 * the specified value be undefined.
 * @private
 * @returns {boolean}
 */
function _toBoolean(value, undefinedValue) {
    return Boolean(typeof value === 'undefined' ? undefinedValue : value);
}

/**
 * Maps (parts of) the Redux state to the associated ParticipantView's props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The React Component props passed to the associated
 * (instance of) ParticipantView.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _avatar: string,
 *     _connectionStatus: string,
 *     _videoTrack: Track
 * }}
 */
function _mapStateToProps(state, ownProps) {
    const { participantId } = ownProps;
    const participant
        = getParticipantById(
            state['features/base/participants'],
            participantId);
    let avatar;
    let connectionStatus;

    if (participant) {
        avatar = getAvatarURL(participant);
        connectionStatus = participant.connectionStatus;

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
        avatar && prefetch({ uri: avatar });
    }

    return {
        _audioOnly: state['features/base/conference'].audioOnly,
        _avatar: avatar,
        _connectionStatus:
            connectionStatus
                || JitsiParticipantConnectionStatus.ACTIVE,
        _videoTrack:
            getTrackByMediaTypeAndParticipant(
                state['features/base/tracks'],
                MEDIA_TYPE.VIDEO,
                participantId)
    };
}

export default connect(_mapStateToProps)(ParticipantView);
