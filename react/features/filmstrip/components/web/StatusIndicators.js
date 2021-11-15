/* @flow */

import React, { Component } from 'react';

import { MEDIA_TYPE } from '../../../base/media';
import { getParticipantByIdOrUndefined, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { getTrackByMediaTypeAndParticipant, isLocalTrackMuted, isRemoteTrackMuted } from '../../../base/tracks';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

import AudioMutedIndicator from './AudioMutedIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import ScreenShareIndicator from './ScreenShareIndicator';
import VideoMutedIndicator from './VideoMutedIndicator';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link StatusIndicators}.
 */
type Props = {

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * Indicates if the audio muted indicator should be visible or not.
     */
    _showAudioMutedIndicator: Boolean,

    /**
     * Indicates if the moderator indicator should be visible or not.
     */
    _showModeratorIndicator: Boolean,

    /**
     * Indicates if the screen share indicator should be visible or not.
     */
    _showScreenShareIndicator: Boolean,

    /**
     * Indicates if the video muted indicator should be visible or not.
     */
    _showVideoMutedIndicator: Boolean,

    /**
     * The ID of the participant for which the status bar is rendered.
     */
    participantID: String
};

/**
 * React {@code Component} for showing the status bar in a thumbnail.
 *
 * @augments Component
 */
class StatusIndicators extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _currentLayout,
            _showAudioMutedIndicator,
            _showModeratorIndicator,
            _showScreenShareIndicator,
            _showVideoMutedIndicator
        } = this.props;
        let tooltipPosition;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
            tooltipPosition = 'right';
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            tooltipPosition = 'left';
            break;
        default:
            tooltipPosition = 'top';
        }

        return (
            <div>
                { _showAudioMutedIndicator ? <AudioMutedIndicator tooltipPosition = { tooltipPosition } /> : null }
                { _showScreenShareIndicator ? <ScreenShareIndicator tooltipPosition = { tooltipPosition } /> : null }
                { _showVideoMutedIndicator ? <VideoMutedIndicator tooltipPosition = { tooltipPosition } /> : null }
                { _showModeratorIndicator ? <ModeratorIndicator tooltipPosition = { tooltipPosition } /> : null }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code StatusIndicators}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {{
 *     _currentLayout: string,
 *     _showModeratorIndicator: boolean,
 *     _showVideoMutedIndicator: boolean
 * }}
*/
function _mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;

    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = getParticipantByIdOrUndefined(state, participantID);

    const tracks = state['features/base/tracks'];
    let isVideoMuted = true;
    let isAudioMuted = true;
    let isScreenSharing = false;

    if (participant?.local) {
        isVideoMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);
        isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
    } else if (!participant?.isFakeParticipant) { // remote participants excluding shared video
        const track = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantID);

        isScreenSharing = track?.videoType === 'desktop';
        isVideoMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.VIDEO, participantID);
        isAudioMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.AUDIO, participantID);
    }

    const { disableModeratorIndicator } = state['features/base/config'];

    return {
        _currentLayout: getCurrentLayout(state),
        _showAudioMutedIndicator: isAudioMuted,
        _showModeratorIndicator:
            !disableModeratorIndicator && participant && participant.role === PARTICIPANT_ROLE.MODERATOR,
        _showScreenShareIndicator: isScreenSharing,
        _showVideoMutedIndicator: isVideoMuted
    };
}

export default connect(_mapStateToProps)(StatusIndicators);
