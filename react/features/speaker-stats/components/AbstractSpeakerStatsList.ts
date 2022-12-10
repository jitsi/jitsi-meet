import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { getLocalParticipant } from '../../base/participants/functions';
import { initUpdateStats } from '../actions.any';
import {
    SPEAKER_STATS_RELOAD_INTERVAL
} from '../constants';

/**
 * Component that renders the list of speaker stats.
 *
 * @param {Function} speakerStatsItem - React element tu use when rendering.
 * @param {Object} itemStyles - Styles for the speaker stats item.
 * @returns {Function}
 */
const abstractSpeakerStatsList = (speakerStatsItem: Function): Function[] => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const {
        stats: speakerStats,
        showFaceExpressions,
        sortedSpeakerStatsIds
    } = useSelector((state: IReduxState) => state['features/speaker-stats']);
    const localParticipant = useSelector(getLocalParticipant);
    const { defaultRemoteDisplayName } = useSelector(
        (state: IReduxState) => state['features/base/config']) || {};
    const { faceLandmarks: faceLandmarksConfig } = useSelector((state: IReduxState) =>
        state['features/base/config']) || {};
    const { faceLandmarks } = useSelector((state: IReduxState) => state['features/face-landmarks'])
        || { faceLandmarks: [] };
    const reloadInterval = useRef<number>();

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {Object}
     * @private
     */
    const getSpeakerStats = useCallback(() => {
        const stats = conference?.getSpeakerStats();

        for (const userId in stats) {
            if (stats[userId]) {
                if (stats[userId].isLocalStats()) {
                    const meString = t('me');

                    stats[userId].setDisplayName(
                        localParticipant?.name
                            ? `${localParticipant.name} (${meString})`
                            : meString
                    );

                    if (faceLandmarksConfig?.enableDisplayFaceExpressions) {
                        stats[userId].setFaceLandmarks(faceLandmarks);
                    }
                }

                if (!stats[userId].getDisplayName()) {
                    stats[userId].setDisplayName(
                        conference?.getParticipantById(userId)?.name
                    );
                }
            }
        }

        return stats ?? {};
    }, [ faceLandmarks ]);

    const updateStats = useCallback(
        () => dispatch(initUpdateStats(getSpeakerStats)),
    [ dispatch, initUpdateStats, getSpeakerStats ]);

    useEffect(() => {
        reloadInterval.current = window.setInterval(() => {
            updateStats();
        }, SPEAKER_STATS_RELOAD_INTERVAL);

        return () => {
            if (reloadInterval.current) {
                clearInterval(reloadInterval.current);
            }
        };
    }, [ faceLandmarks ]);

    const localSpeakerStats = Object.keys(speakerStats).length === 0 ? getSpeakerStats() : speakerStats;
    const localSortedSpeakerStatsIds
        = sortedSpeakerStatsIds.length === 0 ? Object.keys(localSpeakerStats) : sortedSpeakerStatsIds;

    const userIds = localSortedSpeakerStatsIds.filter(id => localSpeakerStats[id] && !localSpeakerStats[id].hidden);

    return userIds.map(userId => {
        const statsModel = localSpeakerStats[userId];
        const props = {
            isDominantSpeaker: statsModel.isDominantSpeaker(),
            dominantSpeakerTime: statsModel.getTotalDominantSpeakerTime(),
            participantId: userId,
            hasLeft: statsModel.hasLeft(),
            faceLandmarks: showFaceExpressions ? statsModel.getFaceLandmarks() : undefined,
            hidden: statsModel.hidden,
            showFaceExpressions,
            displayName: statsModel.getDisplayName() || defaultRemoteDisplayName,
            t
        };

        return speakerStatsItem(props);
    });
};


export default abstractSpeakerStatsList;
