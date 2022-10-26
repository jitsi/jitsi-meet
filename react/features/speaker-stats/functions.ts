import _ from 'lodash';

import { IReduxState } from '../app/types';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import { getParticipantById } from '../base/participants/functions';

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
 * @param {IReduxState} state - The redux state.
 * @param {Object} stats - The current speaker stats.
 * @returns {Object} - Ordered speaker stats ids.
 * @public
 */
export function getSortedSpeakerStatsIds(state: IReduxState, stats: Object) {
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
     * @param {Object} currentParticipant - The first participant for comparison.
     * @param {Object} nextParticipant - The second participant for comparison.
     * @returns {number} - The sort order of the two participants.
     */
    function compareFn(currentParticipant: any, nextParticipant: any) {
        if (orderConfig.includes('hasLeft')) {
            if (nextParticipant.hasLeft() && !currentParticipant.hasLeft()) {
                return -1;
            } else if (currentParticipant.hasLeft() && !nextParticipant.hasLeft()) {
                return 1;
            }
        }

        let result;

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
 * @param {IReduxState} state - The redux state.
 * @param {Object} stats - Speaker stats.
 * @param {Array<string>} orderConfig - Ordering configuration.
 * @returns {Object} - Enhanced speaker stats.
 * @public
 */
function getEnhancedStatsForOrdering(state: IReduxState, stats: any, orderConfig?: string[]) {
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
 * @param {IReduxState} state - The redux state.
 * @param {Object | undefined} stats - The unfiltered stats.
 *
 * @returns {Object} - Filtered speaker stats.
 * @public
 */
export function filterBySearchCriteria(state: IReduxState, stats?: Object) {
    const filteredStats: any = _.cloneDeep(stats ?? getSpeakerStats(state));
    const criteria = getSearchCriteria(state);

    if (criteria !== null) {
        const searchRegex = new RegExp(criteria, 'gi');

        for (const id in filteredStats) {
            if (filteredStats[id].hasOwnProperty('_isLocalStats')) {
                const name = filteredStats[id].getDisplayName();

                filteredStats[id].hidden = !name || !name.match(searchRegex);
            }
        }
    }

    return filteredStats;
}

/**
 * Reset the hidden speaker stats.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Object | undefined} stats - The unfiltered stats.
 *
 * @returns {Object} - Speaker stats.
 * @public
 */
export function resetHiddenStats(state: IReduxState, stats?: Object) {
    const resetStats: any = _.cloneDeep(stats ?? getSpeakerStats(state));

    for (const id in resetStats) {
        if (resetStats[id].hidden) {
            resetStats[id].hidden = false;
        }
    }

    return resetStats;
}
