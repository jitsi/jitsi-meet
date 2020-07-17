/* @flow */

import React, { Component } from 'react';

import { getLocalParticipant, getParticipantById, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
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
     * Indicates if the moderator indicator should be visible or not.
     */
    _showModeratorIndicator: Boolean,

    /**
     * Indicates if the audio muted indicator should be visible or not.
     */
    showAudioMutedIndicator: Boolean,

    /**
     * Indicates if the screen share indicator should be visible or not.
     */
    showScreenShareIndicator: Boolean,

    /**
     * Indicates if the video muted indicator should be visible or not.
     */
    showVideoMutedIndicator: Boolean,

    /**
     * The ID of the participant for which the status bar is rendered.
     */
    participantID: String
};

/**
 * React {@code Component} for showing the status bar in a thumbnail.
 *
 * @extends Component
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
            _showModeratorIndicator,
            showAudioMutedIndicator,
            showScreenShareIndicator,
            showVideoMutedIndicator
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
                { showAudioMutedIndicator ? <AudioMutedIndicator tooltipPosition = { tooltipPosition } /> : null }
                { showScreenShareIndicator ? <ScreenShareIndicator tooltipPosition = { tooltipPosition } /> : null }
                { showVideoMutedIndicator ? <VideoMutedIndicator tooltipPosition = { tooltipPosition } /> : null }
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
 *     _showModeratorIndicator: boolean
 * }}
*/
function _mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;

    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = participantID ? getParticipantById(state, participantID) : getLocalParticipant(state);

    return {
        _currentLayout: getCurrentLayout(state),
        _showModeratorIndicator:
            !interfaceConfig.DISABLE_FOCUS_INDICATOR && participant && participant.role === PARTICIPANT_ROLE.MODERATOR
    };
}

export default connect(_mapStateToProps)(StatusIndicators);
