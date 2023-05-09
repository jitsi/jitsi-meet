import _ from 'lodash';

import { IReduxState } from '../app/types';
import { getConferenceTimestamp } from '../base/conference/functions';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import { getParticipantById } from '../base/participants/functions';
import { FaceLandmarks } from '../face-landmarks/types';

import { THRESHOLD_FIXED_AXIS } from './constants';
import { ISpeaker, ISpeakerStats } from './reducer';

/**
 * Checks if the speaker stats search is disabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the speaker stats search is disabled and false otherwise.
 */
export function isSpeakerStatsSearchDisabled(state: IReduxState) {
    return state['features/base/config']?.speakerStats?.disableSearch;
}

/**
 * Checks if the speaker stats is disabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the speaker stats search is disabled and false otherwise.
 */
export function isSpeakerStatsDisabled(state: IReduxState) {
    return state['features/base/config']?.speakerStats?.disabled;
}

/**
 * Gets whether participants in speaker stats should be ordered or not, and with what priority.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Array<string>} - The speaker stats order array or an empty array.
 */
export function getSpeakerStatsOrder(state: IReduxState) {
    return state['features/base/config']?.speakerStats?.order ?? [
        'role',
        'name',
        'hasLeft'
    ];
}

/**
 * Gets speaker stats.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object} - The speaker stats.
 */
export function getSpeakerStats(state: IReduxState) {
    return state['features/speaker-stats']?.stats ?? {};
}

/**
 * Gets speaker stats search criteria.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string | null} - The search criteria.
 */
export function getSearchCriteria(state: IReduxState) {
    return state['features/speaker-stats']?.criteria;
}

/**
 * Gets if speaker stats reorder is pending.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - The pending reorder flag.
 */
export function getPendingReorder(state: IReduxState) {
    return state['features/speaker-stats']?.pendingReorder ?? false;
}

/**
 * Get sorted speaker stats ids based on a configuration setting.
 *
 * @param {IState} state - The redux state.
 * @param {IState} stats - The current speaker stats.
 * @returns {string[] | undefined} - Ordered speaker stats ids.
 * @public
 */
export function getSortedSpeakerStatsIds(state: IReduxState, stats: ISpeakerStats) {
    const orderConfig = getSpeakerStatsOrder(state);

    if (orderConfig) {
        const enhancedStats = getEnhancedStatsForOrdering(state, stats, orderConfig);

        return Object.entries(enhancedStats)
            .sort(([ , a ], [ , b ]) => compareFn(a, b))
            .map(el => el[0]);
    }

    /**
     *
     * Compares the order of two participants in the speaker stats list.
     *
     * @param {ISpeaker} currentParticipant - The first participant for comparison.
     * @param {ISpeaker} nextParticipant - The second participant for comparison.
     * @returns {number} - The sort order of the two participants.
     */
    function compareFn(currentParticipant: ISpeaker, nextParticipant: ISpeaker) {
        if (orderConfig.includes('hasLeft')) {
            if (nextParticipant.hasLeft() && !currentParticipant.hasLeft()) {
                return -1;
            } else if (currentParticipant.hasLeft() && !nextParticipant.hasLeft()) {
                return 1;
            }
        }

        let result = 0;

        for (const sortCriteria of orderConfig) {
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
                result = (currentParticipant.displayName || '').localeCompare(
                    nextParticipant.displayName || ''
                );
                break;
            }

            if (result !== 0) {
                break;
            }
        }

        return result;
    }
}

/**
 * Enhance speaker stats to include data needed for ordering.
 *
 * @param {IState} state - The redux state.
 * @param {ISpeakerStats} stats - Speaker stats.
 * @param {Array<string>} orderConfig - Ordering configuration.
 * @returns {ISpeakerStats} - Enhanced speaker stats.
 * @public
 */
function getEnhancedStatsForOrdering(state: IReduxState, stats: ISpeakerStats, orderConfig: Array<string>) {
    if (!orderConfig) {
        return stats;
    }

    for (const id in stats) {
        if (stats[id].hasOwnProperty('_hasLeft') && !stats[id].hasLeft()) {
            if (orderConfig.includes('role')) {
                const participant = getParticipantById(state, stats[id].getUserId());

                stats[id].isModerator = participant && participant.role === PARTICIPANT_ROLE.MODERATOR;
            }
        }
    }

    return stats;
}

/**
 * Filter stats by search criteria.
 *
 * @param {IState} state - The redux state.
 * @param {ISpeakerStats | undefined} stats - The unfiltered stats.
 *
 * @returns {ISpeakerStats} - Filtered speaker stats.
 * @public
 */
export function filterBySearchCriteria(state: IReduxState, stats?: ISpeakerStats) {
    const filteredStats = _.cloneDeep(stats ?? getSpeakerStats(state));
    const criteria = getSearchCriteria(state);

    if (criteria !== null) {
        const searchRegex = new RegExp(criteria, 'gi');

        for (const id in filteredStats) {
            if (filteredStats[id].hasOwnProperty('_isLocalStats')) {
                const name = filteredStats[id].getDisplayName();

                filteredStats[id].hidden = !name?.match(searchRegex);
            }
        }
    }

    return filteredStats;
}

/**
 * Reset the hidden speaker stats.
 *
 * @param {IState} state - The redux state.
 * @param {ISpeakerStats | undefined} stats - The unfiltered stats.
 *
 * @returns {Object} - Speaker stats.
 * @public
 */
export function resetHiddenStats(state: IReduxState, stats?: ISpeakerStats) {
    const resetStats = _.cloneDeep(stats ?? getSpeakerStats(state));

    for (const id in resetStats) {
        if (resetStats[id].hidden) {
            resetStats[id].hidden = false;
        }
    }

    return resetStats;
}

/**
 * Gets the current duration of the conference.
 *
 * @param {IState} state - The redux state.
 * @returns {number | null} - The duration in milliseconds or null.
 */
export function getCurrentDuration(state: IReduxState) {
    const startTimestamp = getConferenceTimestamp(state);

    return startTimestamp ? Date.now() - startTimestamp : null;
}

/**
 * Gets the boundaries of the emotion timeline.
 *
 * @param {IState} state - The redux state.
 * @returns {Object} - The left and right boundaries.
 */
export function getTimelineBoundaries(state: IReduxState) {
    const { timelineBoundary, offsetLeft, offsetRight } = state['features/speaker-stats'];
    const currentDuration = getCurrentDuration(state) ?? 0;
    const rightBoundary = timelineBoundary ? timelineBoundary : currentDuration;
    let leftOffset = 0;

    if (rightBoundary > THRESHOLD_FIXED_AXIS) {
        leftOffset = rightBoundary - THRESHOLD_FIXED_AXIS;
    }

    const left = offsetLeft + leftOffset;
    const right = rightBoundary + offsetRight;

    return {
        left,
        right
    };
}

/**
 * Returns the conference start time of the face landmarks.
 *
 * @param {FaceLandmarks} faceLandmarks - The face landmarks.
 * @param {number} startTimestamp - The start timestamp of the conference.
 * @returns {number}
 */
export function getFaceLandmarksStart(faceLandmarks: FaceLandmarks, startTimestamp: number) {
    return faceLandmarks.timestamp - startTimestamp;
}

/**
 * Returns the conference end time of the face landmarks.
 *
 * @param {FaceLandmarks} faceLandmarks - The face landmarks.
 * @param {number} startTimestamp - The start timestamp of the conference.
 * @returns {number}
 */
export function getFaceLandmarksEnd(faceLandmarks: FaceLandmarks, startTimestamp: number) {
    return getFaceLandmarksStart(faceLandmarks, startTimestamp) + faceLandmarks.duration;
}
