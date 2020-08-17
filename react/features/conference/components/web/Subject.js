/* @flow */

import React, { Component } from 'react';

import TimeElapsed from '../../../../features/speaker-stats/components/TimeElapsed';
import { getConferenceName } from '../../../base/conference/functions';
import { getParticipantCount, getDominantSpeaker } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox/functions.web';

import ParticipantsCount from './ParticipantsCount';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * Dominant speaker id
     */
    _id: string,

    /**
     * Whether then participant count should be shown or not.
     */
    _showParticipantCount: boolean,

    /**
     * The subject or the of the conference.
     * Falls back to conference name.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean
};

/**
 * The type of the React {@code Component} state of {@link Subject}.
 */
type State = {

    /**
     * The stats summary provided by the JitsiConference.
     */
    stats: Object,

    /**
     * Dominant speaker stats
     */
    statsModel: Object,

    /**
     * Dominant speaker's time of speak
     */
    time: number
};

/**
 * Subject react component.
 *
 * @class Subject
 */
class Subject extends Component<Props, State> {
    _updateInterval: IntervalID;

    /**
     * Initializes a new Subject instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            stats: props.conference && props.conference.getSpeakerStats(),
            statsModel: undefined,
            time: 0
        };

        this._updateStats = this._updateStats.bind(this);
    }

    /**
     * Begin polling for speaker stats updates.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateInterval = setInterval(this._updateStats, 1000);
    }

    /**
     * Stop polling for speaker stats updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        clearInterval(this._updateInterval);
    }

    _updateStats: () => void;

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @private
     */
    _updateStats() {
        const { conference, _id } = this.props;

        const newStats = conference && conference.getSpeakerStats();
        const newStatsModel = newStats && _id && newStats[_id];
        const newTime = (newStatsModel && newStatsModel.getTotalDominantSpeakerTime()) || 0;

        this.setState({
            stats: newStats,
            statsModel: newStatsModel,
            time: newTime
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _showParticipantCount, _subject, _visible } = this.props;
        const { time } = this.state;

        return (
            <div className = { `subject ${_visible ? 'visible' : ''}` }>
                <span className = 'subject-text'>{ _subject }</span>
                <div className = 'wrapper'>
                    { _showParticipantCount && <ParticipantsCount /> }
                    {time !== 0 && (
                        <TimeElapsed
                            template = 'subject'
                            time = { time } />
                    )}
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);
    const domainSpeaker = getDominantSpeaker(state);

    return {
        _id: domainSpeaker?.id ?? '',
        conference: state['features/base/conference'].conference,
        _showParticipantCount: participantCount > 2,
        _subject: getConferenceName(state),
        _visible: isToolboxVisible(state) && participantCount > 1
    };
}

export default connect(_mapStateToProps)(Subject);
