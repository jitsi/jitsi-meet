/* @flow */

import React, { Component } from 'react';

import { MEDIA_TYPE } from '../../../base/media';
import { getParticipantByIdOrUndefined, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { getTrackByMediaTypeAndParticipant, isLocalTrackMuted, isRemoteTrackMuted } from '../../../base/tracks';
import { getIndicatorsTooltipPosition } from '../../functions.web';

import AudioMutedIndicator from './AudioMutedIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import ScreenShareIndicator from './ScreenShareIndicator';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link StatusIndicators}.
 */
type Props = {

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
     * The ID of the participant for which the status bar is rendered.
     */
    participantID: String,

    /**
     * The type of thumbnail.
     */
    thumbnailType: string
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
            _showAudioMutedIndicator,
            _showModeratorIndicator,
            _showScreenShareIndicator,
            thumbnailType
        } = this.props;
        const tooltipPosition = getIndicatorsTooltipPosition(thumbnailType);

        return (
            <>
                { _showAudioMutedIndicator && <AudioMutedIndicator tooltipPosition = { tooltipPosition } /> }
                { _showModeratorIndicator && <ModeratorIndicator tooltipPosition = { tooltipPosition } />}
                { _showScreenShareIndicator && <ScreenShareIndicator tooltipPosition = { tooltipPosition } /> }
            </>
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
    const { participantID, audio, moderator, screenshare } = ownProps;

    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = getParticipantByIdOrUndefined(state, participantID);

    const tracks = state['features/base/tracks'];
    let isAudioMuted = true;
    let isScreenSharing = false;

    if (participant?.local) {
        isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
    } else if (!participant?.isFakeParticipant) { // remote participants excluding shared video
        const track = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantID);

        isScreenSharing = track?.videoType === 'desktop';
        isAudioMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.AUDIO, participantID);
    }

    const { disableModeratorIndicator } = state['features/base/config'];

    return {
        _showAudioMutedIndicator: isAudioMuted && audio,
        _showModeratorIndicator:
            !disableModeratorIndicator && participant && participant.role === PARTICIPANT_ROLE.MODERATOR && moderator,
        _showScreenShareIndicator: isScreenSharing && screenshare
    };
}

export default connect(_mapStateToProps)(StatusIndicators);
