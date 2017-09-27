import PropTypes from 'prop-types';
import React, { Component } from 'react';

import TimeElapsed from './TimeElapsed';

/**
 * React component for display an individual user's speaker stats.
 *
 * @extends Component
 */
class SpeakerStatsItem extends Component {
    /**
     * SpeakerStatsItem component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The name of the participant.
         */
        displayName: PropTypes.string,

        /**
         * The total milliseconds the participant has been dominant speaker.
         */
        dominantSpeakerTime: PropTypes.number,

        /**
         * True if the participant is no longer in the meeting.
         */
        hasLeft: PropTypes.bool,

        /**
         * True if the participant is currently the dominant speaker.
         */
        isDominantSpeaker: PropTypes.bool
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const hasLeftClass = this.props.hasLeft ? 'status-user-left' : '';
        const rowDisplayClass = `speaker-stats-item ${hasLeftClass}`;

        const dotClass = this.props.isDominantSpeaker
            ? 'status-active' : 'status-inactive';
        const speakerStatusClass = `speaker-stats-item__status-dot ${dotClass}`;

        return (
            <div className = { rowDisplayClass }>
                <div className = 'speaker-stats-item__status'>
                    <span className = { speakerStatusClass } />
                </div>
                <div className = 'speaker-stats-item__name'>
                    { this.props.displayName }
                </div>
                <div className = 'speaker-stats-item__time'>
                    <TimeElapsed
                        time = { this.props.dominantSpeakerTime } />
                </div>
            </div>
        );
    }
}

export default SpeakerStatsItem;
