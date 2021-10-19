// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { getLocalParticipant } from '../../../base/participants';
import { closeSpeakerStats, initUpdateStats } from '../../actions';
import {
    SPEAKER_STATS_RELOAD_INTERVAL, SPEAKER_STATS_VIEW_MODEL_ID
} from '../../constants';
import { getSearchCriteria, getSpeakerStats } from '../../functions';

import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';

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
    _conference: Object,

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
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
class SpeakerStats extends PureComponent<Props> {
    /**
     * Instantiates a new {@code SpeakerStats}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._updateStats = this._updateStats.bind(this);
        this._onClose = this._onClose.bind(this);

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
     * Implements {@code SpeakerStats.render}.
     *
     * @inheritdoc
     */
    render() {
        const userIds = Object.keys(this.props._stats);
        const items = userIds.map(userId => this._createStatsItem(userId));

        return (
            <JitsiModal
                headerProps = {{
                    headerLabelKey: 'speakerStats.speakerStats'
                }}
                modalId = { SPEAKER_STATS_VIEW_MODEL_ID }
                onClose = { this._onClose } >

                <View>
                    <SpeakerStatsLabels />
                    { items }
                </View>
            </JitsiModal>
        );
    }

    _onClose: () => boolean;

    /**
     * Closes the modal.
     *
     * @returns {boolean}
     */
    _onClose() {
        this.props.dispatch(closeSpeakerStats());

        return true;
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
        const stats = { ...this.props._conference?.getSpeakerStats() };

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
            }
        }

        return stats;
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
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
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
        _criteria: getSearchCriteria(state),
        _conference: state['features/base/conference'].conference
    };
}


export default translate(connect(_mapStateToProps)(SpeakerStats));
