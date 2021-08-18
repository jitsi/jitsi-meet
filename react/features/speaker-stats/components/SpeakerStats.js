// @flow

import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant, getParticipantById, PARTICIPANT_ROLE } from '../../base/participants';
import { connect } from '../../base/redux';
import { escapeRegexp, objectSort } from '../../base/util';
import { getSpeakerStatsOrder } from '../functions';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsSearch from './SpeakerStatsSearch';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link SpeakerStats}.
 */
type Props = {

    /**
     * The display name for the local participant obtained from the redux store.
     */
    _localDisplayName: string,

    /**
     * The configuration setting to order paricipants.
     */
    _speakerStatsOrder: Array<String>,

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SpeakerStats}.
 */
type State = {

    /**
     * The stats summary provided by the JitsiConference.
     */
    stats: Object,

    /**
     * The search input criteria.
     */
    criteria: string,
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class SpeakerStats extends Component<Props, State> {
    _updateInterval: IntervalID;

    /**
     * Initializes a new SpeakerStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            stats: this._getSpeakerStats(),
            criteria: ''
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

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const userIds = Object.keys(this.state.stats);
        const items = userIds.map(userId => this._createStatsItem(userId));

        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = { 'speakerStats.speakerStats' }>
                <div className = 'speaker-stats'>
                    <SpeakerStatsSearch onSearch = { this._onSearch } />
                    <SpeakerStatsLabels />
                    { items }
                </div>
            </Dialog>
        );
    }

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @private
     */
    _getSpeakerStats() {
        const stats = { ...this.props.conference.getSpeakerStats() };

        if (this.state?.criteria) {
            const searchRegex = new RegExp(this.state.criteria, 'gi');

            for (const id in stats) {
                if (stats[id].hasOwnProperty('_isLocalStats')) {
                    const name = stats[id].isLocalStats() ? this.props._localDisplayName : stats[id].getDisplayName();

                    if (!name || !name.match(searchRegex)) {
                        delete stats[id];
                    }
                }
            }
        }

        if (this.props._speakerStatsOrder.length) {
            return this._getSortedSpeakerStats(stats);
        }

        return stats;
    }

    /**
     * Get sorted speaker stats based on a configuration setting.
     *
     * @param {Object} stats - Unordered speaker stats.
     * @returns {Object} - Ordered speaker stats.
     * @private
     */
    _getSortedSpeakerStats(stats) {
        for (const id in stats) {
            if (stats[id].hasOwnProperty('_hasLeft') && !stats[id].hasLeft()) {
                if (this.props._speakerStatsOrder.includes('name')) {
                    const { _localDisplayName } = this.props;

                    if (stats[id].isLocalStats()) {
                        stats[id].setDisplayName(_localDisplayName);
                    }
                }

                if (this.props._speakerStatsOrder.includes('role')) {
                    const participant = getParticipantById(APP.store.getState(), stats[id].getUserId());

                    stats[id].isModerator = participant.role === PARTICIPANT_ROLE.MODERATOR;
                }
            }
        }

        return objectSort(stats, (currentParticipant, nextParticipant) => {
            if (this.props._speakerStatsOrder.includes('hasLeft')) {
                if (nextParticipant.hasLeft() && !currentParticipant.hasLeft()) {
                    return -1;
                } else if (currentParticipant.hasLeft() && !nextParticipant.hasLeft()) {
                    return 1;
                }
            }

            let result;

            for (const sortCriteria of this.props._speakerStatsOrder) {
                switch (sortCriteria) {
                case 'role':
                    if (!nextParticipant.isModerator && currentParticipant.isModerator) {
                        result = -1;
                    } else if (!currentParticipant.isModerator && nextParticipant.isModerator) {
                        result = 1;
                    } else {
                        result = 0;
                    }
                    break;
                case 'name':
                    result = (currentParticipant.getDisplayName() || '').localeCompare(
                        nextParticipant.getDisplayName() || ''
                    );
                    break;
                }

                if (result !== 0) {
                    break;
                }
            }

            return result;
        });
    }

    /**
     * Create a SpeakerStatsItem instance for the passed in user id.
     *
     * @param {string} userId -  User id used to look up the associated
     * speaker stats from the jitsi library.
     * @returns {SpeakerStatsItem|null}
     * @private
     */
    _createStatsItem(userId) {
        const statsModel = this.state.stats[userId];

        if (!statsModel) {
            return null;
        }

        const isDominantSpeaker = statsModel.isDominantSpeaker();
        const dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        const hasLeft = statsModel.hasLeft();

        let displayName;

        if (statsModel.isLocalStats()) {
            const { t } = this.props;
            const meString = t('me');

            displayName = this.props._localDisplayName;
            displayName
                = displayName ? `${displayName} (${meString})` : meString;
        } else {
            displayName
                = this.state.stats[userId].getDisplayName()
                    || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }

        return (
            <SpeakerStatsItem
                displayName = { displayName }
                dominantSpeakerTime = { dominantSpeakerTime }
                hasLeft = { hasLeft }
                isDominantSpeaker = { isDominantSpeaker }
                key = { userId } />
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
        this.setState({
            ...this.state,
            criteria: escapeRegexp(criteria)
        });
    }

    _updateStats: () => void;

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @private
     */
    _updateStats() {
        const stats = this._getSpeakerStats();

        this.setState({
            ...this.state,
            stats
        });
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localDisplayName: ?string,
 *     _speakerStatsOrder: Array<string>
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
        _speakerStatsOrder: getSpeakerStatsOrder(state)
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStats));
