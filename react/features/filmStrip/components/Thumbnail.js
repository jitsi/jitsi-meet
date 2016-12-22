import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    Audio,
    MEDIA_TYPE
} from '../../base/media';
import {
    PARTICIPANT_ROLE,
    pinParticipant
} from '../../base/participants';
import { Container } from '../../base/react';
import { getTrackByMediaTypeAndParticipant } from '../../base/tracks';
import { ParticipantView } from '../../conference';

import {
    AudioMutedIndicator,
    DominantSpeakerIndicator,
    ModeratorIndicator,
    styles,
    VideoMutedIndicator
} from './_';

/**
 * React component for video thumbnail.
 * @extends Component
 */
class Thumbnail extends Component {
    /**
     * Thumbnail component's property types.
     *
     * @static
     */
    static propTypes = {
        audioTrack: React.PropTypes.object,
        dispatch: React.PropTypes.func,
        largeVideo: React.PropTypes.object,
        participant: React.PropTypes.object,
        videoTrack: React.PropTypes.object
    }

    /**
     * Initializes new Video Thumbnail component.
     *
     * @param {Object} props - Component props.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Handles click/tap event on the thumbnail.
     *
     * @returns {void}
     */
    _onClick() {
        const { dispatch, participant } = this.props;

        // TODO The following currently ignores interfaceConfig.filmStripOnly.
        dispatch(pinParticipant(participant.pinned ? null : participant.id));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            audioTrack,
            largeVideo,
            participant,
            videoTrack
        } = this.props;

        let style = styles.thumbnail;

        if (participant.pinned) {
            style = {
                ...style,
                ...styles.thumbnailPinned
            };
        }

        const thumbToolbarStyle = styles.thumbnailIndicatorContainer;

        // We don't render audio in any of the following:
        // 1. The audio (source) is muted. There's no practical reason (that we
        //    know of, anyway) why we'd want to render it given that it's
        //    silence (& not even comfort noise).
        // 2. The audio is local. If we were to render local audio, the local
        //    participants would be hearing themselves.
        const audioMuted = !audioTrack || audioTrack.muted;
        const renderAudio = !audioMuted && !audioTrack.local;
        const participantId = participant.id;
        const participantNotInLargeVideo
            = participantId !== largeVideo.participantId;
        const videoMuted = !videoTrack || videoTrack.muted;

        return (
            <Container
                onClick = { this._onClick }
                style = { style }>

                { renderAudio
                    && <Audio
                        stream
                            = { audioTrack.jitsiTrack.getOriginalStream() } /> }

                <ParticipantView
                    participantId = { participantId }
                    showAvatar = { participantNotInLargeVideo }
                    showVideo = { participantNotInLargeVideo }
                    zOrder = { 1 } />

                { participant.role === PARTICIPANT_ROLE.MODERATOR
                    && <ModeratorIndicator /> }

                { participant.dominantSpeaker
                    && <DominantSpeakerIndicator /> }

                <Container style = { thumbToolbarStyle }>
                    { audioMuted
                        && <AudioMutedIndicator /> }

                    { videoMuted
                        && <VideoMutedIndicator /> }
                </Container>

            </Container>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {{
 *      audioTrack: Track,
 *      largeVideo: Object,
 *      videoTrack: Track
 *  }}
 */
function mapStateToProps(state, ownProps) {
    // We need read-only access to the state of features/largeVideo so that the
    // film strip doesn't render the video of the participant who is rendered on
    // the stage i.e. as a large video.
    const largeVideo = state['features/largeVideo'];
    const tracks = state['features/base/tracks'];
    const id = ownProps.participant.id;
    const audioTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const videoTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);

    return {
        audioTrack,
        largeVideo,
        videoTrack
    };
}

export default connect(mapStateToProps)(Thumbnail);
