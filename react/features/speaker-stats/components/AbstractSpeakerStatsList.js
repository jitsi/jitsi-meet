// @flow

import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant } from '../../base/participants';
import { initUpdateStats } from '../actions';
import {
    SPEAKER_STATS_RELOAD_INTERVAL
} from '../constants';

/**
 * Component that renders the list of speaker stats.
 *
 * @param {Function} speakerStatsItem - React element tu use when rendering.
 * @param {boolean} [isWeb=false] - Is for web in browser.
 * @returns {Function}
 */
const abstractSpeakerStatsList = (speakerStatsItem: Function, isWeb: boolean = true): Function[] => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const conference = useSelector(state => state['features/base/conference'].conference);
    const localParticipant = useSelector(getLocalParticipant);
    const { enableFacialRecognition } = isWeb ? useSelector(state => state['features/base/config']) : {};
    const { facialExpressions: localFacialExpressions } = isWeb
        ? useSelector(state => state['features/facial-recognition']) : {};

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
                    if (enableFacialRecognition) {
                        stats[userId].setFacialExpressions(localFacialExpressions);
                    }
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

    const updateStats = useCallback(
        () => dispatch(initUpdateStats(
            () => getLocalSpeakerStats())), [ dispatch, initUpdateStats() ]);

    useEffect(() => {
        const updateInterval = setInterval(() => updateStats(), SPEAKER_STATS_RELOAD_INTERVAL);

        return () => {
            clearInterval(updateInterval);
        };
    }, [ dispatch, conference ]);

    const userIds = Object.keys(getLocalSpeakerStats());

    return userIds.map(userId => {
        const statsModel = getLocalSpeakerStats()[userId];

        if (!statsModel || statsModel.hidden) {
            return null;
        }
        const props = {};

        props.isDominantSpeaker = statsModel.isDominantSpeaker();
        props.dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        props.hasLeft = statsModel.hasLeft();
        if (enableFacialRecognition) {
            props.facialExpressions = statsModel.getFacialExpressions();
        }
        props.showFacialExpressions = enableFacialRecognition;
        props.displayName = statsModel.getDisplayName();
        props.t = t;

        return speakerStatsItem(props);
    });
};


export default abstractSpeakerStatsList;
