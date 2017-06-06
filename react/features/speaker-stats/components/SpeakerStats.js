/* global APP, interfaceConfig */

import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';

/**
 * React {@code Component} for displaying a list of speaker stats.
 *
 * @extends Component
 */
class SpeakerStats extends Component {
    /**
     * {@code SpeakerStats}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference from which stats will be pulled.
         */
        conference: React.PropTypes.object,

        /**
         * The function to translate human-readable text.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code SpeakerStats} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * A cached reference to the local speaker stats object obtained
             * from the library. It will be parsed to display stats.
             *
             * type {@object}
             */
            stats: {}
        };

        /**
         * The return value from the interval used to poll for new local speaker
         * stats.
         *
         * @private
         * @type {timeoutID}
         */
        this._updateInterval = null;

        // Bind event handlers so they are only bound once for every instance.
        this._updateStats = this._updateStats.bind(this);
    }

    /**
     * Requests for updated speaker stats and begins polling for speaker stats
     * updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this._updateStats();
        this._updateInterval = setInterval(this._updateStats, 1000);
    }

    /**
     * Stops polling for speaker stats updates.
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
                cancelTitleKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'speakerStats.speakerStats'>
                <div className = 'speaker-stats'>
                    <SpeakerStatsLabels />
                    { items }
                </div>
            </Dialog>
        );
    }

    /**
     * Creates a {@code SpeakerStatsItem} instance for the passed in user id.
     *
     * @param {string} userId -  User id used to look up the associated speaker
     * stats from the jitsi library.
     * @private
     * @returns {SpeakerStatsItem|null}
     */
    _createStatsItem(userId) {
        const statsModel = this.state.stats[userId];

        if (!statsModel) {
            return null;
        }

        const isDominantSpeaker = statsModel.isDominantSpeaker();
        const dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        const hasLeft = statsModel.hasLeft();

        let displayName = '';

        if (statsModel.isLocalStats()) {
            const { t } = this.props;
            const meString = t('me');

            displayName = APP.settings.getDisplayName();
            displayName = displayName ? `${displayName} (${meString})`
                : meString;
        } else {
            displayName = this.state.stats[userId].getDisplayName()
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

    /**
     * Updates the internal state with the latest speaker stats.
     *
     * @private
     * @returns {void}
     */
    _updateStats() {
        const stats = this.props.conference.getSpeakerStats();

        this.setState({ stats });
    }
}

export default translate(SpeakerStats);
