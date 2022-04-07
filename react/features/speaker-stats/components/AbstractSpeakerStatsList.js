// @flow

import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant } from '../../base/participants';
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
const abstractSpeakerStatsList = (speakerStatsItem: Function, itemStyles?: Object): Function[] => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const conference = useSelector(state => state['features/base/conference'].conference);
    const { stats: speakerStats, showFaceExpressions } = useSelector(state => state['features/speaker-stats']);
    const localParticipant = useSelector(getLocalParticipant);
    const { defaultRemoteDisplayName } = useSelector(
        state => state['features/base/config']) || {};
    const { faceLandmarks } = useSelector(state => state['features/base/config']) || {};
    const { faceExpressions } = useSelector(state => state['features/face-landmarks']) || {};
    const reloadInterval = useRef(null);

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {Object}
     * @private
     */
    const getSpeakerStats = useCallback(() => {
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
                        stats[userId].setFaceExpressions(faceExpressions);
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
    }, [ faceExpressions ]);

    const updateStats = useCallback(
        () => dispatch(initUpdateStats(getSpeakerStats)),
    [ dispatch, initUpdateStats, getSpeakerStats ]);

    useEffect(() => {
        if (reloadInterval.current) {
            clearInterval(reloadInterval.current);
        }
        reloadInterval.current = setInterval(() => {
            updateStats();
        }, SPEAKER_STATS_RELOAD_INTERVAL);

        return () => clearInterval(reloadInterval.current);
    }, [ faceExpressions ]);

    const localSpeakerStats = Object.keys(speakerStats).length === 0 ? getSpeakerStats() : speakerStats;
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
