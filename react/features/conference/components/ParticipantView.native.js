import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    MEDIA_TYPE,
    shouldRenderVideoTrack,
    VideoTrack
} from '../../base/media';
import { getParticipantById } from '../../base/participants';
import { Container } from '../../base/react';
import { getTrackByMediaTypeAndParticipant } from '../../base/tracks';

import Avatar from './Avatar';
import { styles } from './styles';

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
         * The source (e.g. URI, URL) of the avatar image of the participant
         * with {@link #participantId}.
         *
         * @private
         */
        _avatar: React.PropTypes.string,

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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // Is the video to be rendered?
        const videoTrack = this.props._videoTrack;

        // FIXME It's currently impossible to have true as the value of
        // waitForVideoStarted because videoTrack's state videoStarted will be
        // updated only after videoTrack is rendered.
        const waitForVideoStarted = false;
        const renderVideo
            = shouldRenderVideoTrack(videoTrack, waitForVideoStarted);

        // Is the avatar to be rendered?
        const avatar = this.props._avatar;
        const renderAvatar
            = !renderVideo && typeof avatar !== 'undefined' && avatar !== '';

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
 * @returns {{
 *     _avatar: string,
 *     _videoTrack: Track
 * }}
 */
function mapStateToProps(state, ownProps) {
    const participantId = ownProps.participantId;
    const participant
        = getParticipantById(
            state['features/base/participants'],
            participantId);

    return {
        _avatar: participant ? participant.avatar : undefined,
        _videoTrack:
            getTrackByMediaTypeAndParticipant(
                state['features/base/tracks'],
                MEDIA_TYPE.VIDEO,
                participantId)
    };
}

export default connect(mapStateToProps)(ParticipantView);
