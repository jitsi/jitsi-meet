/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import TimeElapsed from './TimeElapsed';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsItem}.
 */
type Props = {

    /**
     * The name of the participant.
     */
    displayName: string,

    /**
     * The total milliseconds the participant has been dominant speaker.
     */
    dominantSpeakerTime: number,

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @extends Component
 */
class SpeakerStatsItem extends Component<Props> {
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
                <div
                    aria-label = { this.props.t('speakerStats.speakerStats') }
                    className = 'speaker-stats-item__name'>
                    { this.props.displayName }
                </div>
                <div
                    aria-label = { this.props.t('speakerStats.speakerTime') }
                    className = 'speaker-stats-item__time'>
                    <TimeElapsed
                        time = { this.props.dominantSpeakerTime } />
                </div>
            </div>
        );
    }
}

export default translate(SpeakerStatsItem);
