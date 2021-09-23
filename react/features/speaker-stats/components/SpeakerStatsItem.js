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
     * The object that has as keys the facial expressions of the
     * participant and as values a number that represents the count .
     */
    facialExpressions: Object,

    /**
     * True if the participant is no longer in the meeting.
     */
    hasLeft: boolean,

    /**
     * True if the participant is currently the dominant speaker.
     */
    isDominantSpeaker: boolean,

    /**
     * True if the client width is les than 750.
     */
    reduceExpressions: boolean,

    /**
     * True if the facial recognition is not disabled.
     */
    showFacialExpressions: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @augments Component
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
                    className = { `speaker-stats-item__name${
                        this.props.showFacialExpressions ? '_expressions_on' : ''
                    }` }>
                    { this.props.displayName }
                </div>
                <div
                    aria-label = { this.props.t('speakerStats.speakerTime') }
                    className = { `speaker-stats-item__time${
                        this.props.showFacialExpressions ? '_expressions_on' : ''
                    }` }>
                    <TimeElapsed
                        time = { this.props.dominantSpeakerTime } />
                </div>
                { this.props.showFacialExpressions
                    && (
                        <>
                            <div
                                aria-label = { 'Happy' }
                                className = 'speaker-stats-item__expression'>
                                { this.props.facialExpressions.happy }
                            </div>
                            <div
                                aria-label = { 'Neutral' }
                                className = 'speaker-stats-item__expression'>
                                { this.props.facialExpressions.neutral }
                            </div>
                            <div
                                aria-label = { 'Sad' }
                                className = 'speaker-stats-item__expression'>
                                { this.props.facialExpressions.sad }
                            </div>
                            <div
                                aria-label = { 'Surprised' }
                                className = 'speaker-stats-item__expression'>
                                { this.props.facialExpressions.surprised }
                            </div>
                            {!this.props.reduceExpressions && (
                                <>
                                    <div
                                        aria-label = { 'Angry' }
                                        className = 'speaker-stats-item__expression'>
                                        { this.props.facialExpressions.angry }
                                    </div>
                                    <div
                                        aria-label = { 'Fearful' }
                                        className = 'speaker-stats-item__expression'>
                                        { this.props.facialExpressions.fearful }
                                    </div>
                                    <div
                                        aria-label = { 'Disgusted' }
                                        className = 'speaker-stats-item__expression'>
                                        { this.props.facialExpressions.disgusted }
                                    </div>
                                </>
                            )}
                        </>
                    )
                }


            </div>
        );
    }
}

export default translate(SpeakerStatsItem);
