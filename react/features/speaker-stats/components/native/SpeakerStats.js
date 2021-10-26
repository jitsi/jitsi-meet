// @flow

import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants';
import { initUpdateStats } from '../../actions';
import {
    SPEAKER_STATS_RELOAD_INTERVAL
} from '../../constants';
import SpeakerStatsItem from '../native/SpeakerStatsItem';

import SpeakerStatsLabels from './SpeakerStatsLabels';
import style from './styles';

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStats = () => {

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const conference = useSelector(state => state['features/base/conference'].conference);
    const localDisplayName = useSelector(getLocalParticipant)?.name || '';

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {Object}
     * @private
     */
    const getLocalSpeakerStats = () => {
        const stats = conference.getSpeakerStats();

        for (const userId in stats) {
            if (stats[userId]) {
                if (stats[userId].isLocalStats()) {
                    const meString = t('me');

                    stats[userId].setDisplayName(
                        localDisplayName
                            ? `${localDisplayName} (${meString})`
                            : meString
                    );
                }
            }
        }

        return stats;
    };

    const updateStats = useCallback(() => dispatch(initUpdateStats(() => getLocalSpeakerStats())));

    useEffect(() => {
        const updateInterval = setInterval(() => updateStats(), SPEAKER_STATS_RELOAD_INTERVAL);

        return () => {
            clearInterval(updateInterval);
        };
    });


    const userIds = Object.keys(getLocalSpeakerStats());
    const items = userIds.map(userId => {
        const statsModel = getLocalSpeakerStats()[userId];

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
    });

    return (
        <JitsiScreen
            hasTabNavigator = { false }
            style = { style.speakerStatsContainer }>
            <SpeakerStatsLabels />
            { items }
        </JitsiScreen>
    );
};


export default SpeakerStats;
