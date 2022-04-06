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
 * @param {Object} itemStyles - Styles for the speaker stats item.
 * @returns {Function}
 */
const abstractSpeakerStatsList = (speakerStatsItem: Function, itemStyles?: Object): Function[] => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const conference = useSelector(state => state['features/base/conference'].conference);
    const { stats: speakerStats, showFaceExpressions } = useSelector(state => state['features/speaker-stats']);
    const localParticipant = useSelector(getLocalParticipant);
    const { defaultRemoteDisplayName } = useSelector(
        state => state['features/base/config']) || {};
    const { faceLandmarks } = useSelector(state => state['features/base/config']) || {};
    const { faceExpressions: localFaceExpressions } = useSelector(
        state => state['features/face-landmarks']) || {};

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
                    if (faceLandmarks?.enableDisplayFaceExpressions) {
                        stats[userId].setFaceExpressions(localFaceExpressions);
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
        () => dispatch(initUpdateStats(getLocalSpeakerStats)),
        [ dispatch, initUpdateStats ]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            updateStats();
        }, SPEAKER_STATS_RELOAD_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    const localSpeakerStats = Object.keys(speakerStats).length === 0 ? getLocalSpeakerStats() : speakerStats;
    const userIds = Object.keys(localSpeakerStats).filter(id => localSpeakerStats[id] && !localSpeakerStats[id].hidden);

    return userIds.map(userId => {
        const statsModel = localSpeakerStats[userId];
        const props = {};

        props.isDominantSpeaker = statsModel.isDominantSpeaker();
        props.dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        props.participantId = userId;
        props.hasLeft = statsModel.hasLeft();
        if (showFaceExpressions) {
            props.faceExpressions = statsModel.getFaceExpressions();
        }
        props.hidden = statsModel.hidden;
        props.showFaceExpressions = showFaceExpressions;
        props.displayName = statsModel.getDisplayName() || defaultRemoteDisplayName;
        if (itemStyles) {
            props.styles = itemStyles;
        }
        props.t = t;

        return speakerStatsItem(props);
    });
};


export default abstractSpeakerStatsList;
