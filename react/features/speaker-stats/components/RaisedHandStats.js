// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { getLocalParticipant, getParticipants } from '../../base/participants';
import { connect } from '../../base/redux';
import { escapeRegexp } from '../../base/util';
import { initSearch } from '../actions';
import { SPEAKER_STATS_RELOAD_INTERVAL } from '../constants';
import { getSearchCriteria } from '../functions';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsSearch from './SpeakerStatsSearch';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link RaisedHandStats}.
 */
type Props = {

    /**
     * The display name for the local participant obtained from the redux store.
     */
    _localDisplayName: string,

    /**
     * The search criteria.
     */
    _criteria: string,

    /**
     * The participants.
     */
    _participants: Object,

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

type State = {
    /**
     * The stats summary provided by the Redux store.
     */
    participants: Object[]
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class RaisedHandStats extends Component<Props, State> {
    _updateInterval: IntervalID;

    /**
     * Initializes a new RaisedHandStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            participants: props._participants
        };

        // Bind event handlers so they are only bound once per instance.
        this._updateStats = this._updateStats.bind(this);
        this._onSearch = this._onSearch.bind(this);
    }

    /**
     * Begin polling for speaker stats updates.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateStats();
        this._updateInterval = setInterval(() => this._updateStats(), SPEAKER_STATS_RELOAD_INTERVAL);
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

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const items = this.state.participants.map(p => this._createStatsItem(p));

        return (
            <div className = 'speaker-stats'>
                <SpeakerStatsSearch
                    initCriteria = { this.props._criteria }
                    onSearch = { this._onSearch } />
                <SpeakerStatsLabels raisedHand = { true } />
                {items}
            </div>
        );
    }

    /**
     * Create a SpeakerStatsItem instance for the passed in participant.
     *
     * @param {Object} participant -  Participant used to look up the associated
     * speaker stats from the Redux store.
     * @returns {SpeakerStatsItem|null}
     * @private
     */
    _createStatsItem(participant) {
        if (!participant || !participant?.raisedHand?.raisedAt) {
            return null;
        }

        const { t } = this.props;
        const meString = t('me');

        let displayName = participant.name;

        if (participant.local) {
            displayName = `${displayName} (${meString})`;
        }

        return (
            <SpeakerStatsItem
                displayName = { displayName }
                dominantSpeakerTime = { (Date.now() - participant?.raisedHand?.raisedAt) }
                hasLeft = { false }
                isDominantSpeaker = { participant.dominantSpeaker }
                key = { participant.id } />
        );
    }

    _onSearch: () => void;

    /**
     * Search the existing participants by name.
     *
     * @returns {void}
     * @param {string} criteria - The search parameter.
     * @protected
     */
    _onSearch(criteria = '') {
        this.props.dispatch(initSearch(escapeRegexp(criteria)));
        this._updateStats(escapeRegexp(criteria));
    }

    _updateStats: () => void;

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @param {string} criteria - The search parameter.
     * @private
     */
    _updateStats(criteria = '') {
        const search = escapeRegexp(criteria || this.props._criteria);
        const participants = this.props._participants
            .filter(p => p?.raisedHand?.raisedAt && (p.name.includes(search) || !search)).sort((a, b) => {
                if (a?.raisedHand?.raisedAt < b?.raisedHand?.raisedAt) {
                    return -1;
                }
                if (a?.raisedHand?.raisedAt > b?.raisedHand?.raisedAt) {
                    return 1;
                }

                return 0;
            });

        this.setState({ participants });
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localDisplayName: ?string,
 *     _criteria: string,
 *     _participants: Arran<Object>
 * }}
 */
function _mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);

    return {
        /**
         * The local display name.
         *
         * @private
         * @type {string|undefined}
         */
        _localDisplayName: localParticipant && localParticipant.name,
        _criteria: getSearchCriteria(state),
        _participants: getParticipants(state)
    };
}

export default translate(connect(_mapStateToProps)(RaisedHandStats));
