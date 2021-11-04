// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { escapeRegexp } from '../../base/util';
import { initUpdateStats, initSearch } from '../actions';
import { SPEAKER_STATS_RELOAD_INTERVAL } from '../constants';
import { getSpeakerStats, getSearchCriteria } from '../functions';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';
import SpeakerStatsSearch from './SpeakerStatsSearch';

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
     * The speaker paricipant stats.
     */
    _stats: Object,

    /**
     * The search criteria.
     */
    _criteria: string | null,

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

/**
 * React component for displaying a list of speaker stats.
 *
 * @augments Component
 */
class SpeakerStats extends Component<Props> {
    _updateInterval: IntervalID;

    /**
     * Initializes a new SpeakerStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._updateStats = this._updateStats.bind(this);
        this._onSearch = this._onSearch.bind(this);

        this._updateStats();
    }

    /**
     * Begin polling for speaker stats updates.
     *
     * @inheritdoc
     */
    componentDidMount() {
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
        const userIds = Object.keys(this.props._stats);
        const items = userIds.map(userId => this._createStatsItem(userId));

        return (
            <Dialog
                cancelKey = 'dialog.close'
                submitDisabled = { true }
                titleKey = 'speakerStats.speakerStats'>
                <div className = 'speaker-stats'>
                    <SpeakerStatsSearch onSearch = { this._onSearch } />
                    <SpeakerStatsLabels />
                    { items }
                </div>
            </Dialog>
        );
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
        const statsModel = this.props._stats[userId];

        if (!statsModel || statsModel.hidden) {
            return null;
        }

        const isDominantSpeaker = statsModel.isDominantSpeaker();
        const dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        const hasLeft = statsModel.hasLeft();

        return (
            <SpeakerStatsItem
                displayName = { statsModel.getDisplayName() }
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
        this.props.dispatch(initSearch(escapeRegexp(criteria)));
    }

    _updateStats: () => void;

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @private
     */
    _updateStats() {
        this.props.dispatch(initUpdateStats(() => this._getSpeakerStats()));
    }

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {Object}
     * @private
     */
    _getSpeakerStats() {
        const stats = { ...this.props.conference.getSpeakerStats() };

        for (const userId in stats) {
            if (stats[userId]) {
                if (stats[userId].isLocalStats()) {
                    const { t } = this.props;
                    const meString = t('me');

                    stats[userId].setDisplayName(
                        this.props._localDisplayName
                            ? `${this.props._localDisplayName} (${meString})`
                            : meString
                    );
                }

                if (!stats[userId].getDisplayName()) {
                    stats[userId].setDisplayName(
                        interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME
                    );
                }
            }
        }

        return stats;
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localDisplayName: ?string,
 *     _stats: Object,
 *     _criteria: string,
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
        _stats: getSpeakerStats(state),
        _criteria: getSearchCriteria(state)
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStats));
