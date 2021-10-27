// @flow

import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import {
    getLocalParticipant
} from '../../../base/participants';
import { initUpdateStats } from '../../actions';
import {
    SPEAKER_STATS_RELOAD_INTERVAL
} from '../../constants';
import SpeakerStatsItem from '../native/SpeakerStatsItem';

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStatsList = () => {

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const conference = useSelector(state => state['features/base/conference'].conference);
    const localParticipant = useSelector(getLocalParticipant);

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {Object}
     * @private
     */
    const getLocalSpeakerStats = useCallback(() => {
        const stats = conference.getSpeakerStats();

        for (const userId in stats) {
            if (stats[userId]) {
                if (stats[userId].isLocalStats()) {
                    const meString = t('me');

                    stats[userId].setDisplayName(
                        localParticipant.name
                            ? `${localParticipant.name} (${meString})`
                            : meString
                    );
                }

                if (!stats[userId].getDisplayName()) {
                    stats[userId].setDisplayName(
                        conference.getParticipantById(userId)?.name
                    );
                }
            }
        }

        return stats;
    });

    const updateStats = useCallback(() => dispatch(initUpdateStats(() => getLocalSpeakerStats())), [ dispatch ]);

    useEffect(() => {
        const updateInterval = setInterval(() => updateStats(), SPEAKER_STATS_RELOAD_INTERVAL);

        return () => {
            clearInterval(updateInterval);
        };
    }, [ dispatch ]);


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
        <View>
            {items}
        </View>
    );
};


export default SpeakerStatsList;
