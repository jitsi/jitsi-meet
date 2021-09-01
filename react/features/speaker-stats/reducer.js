// @flow

import _ from 'lodash';

import { ReducerRegistry } from '../base/redux';

import {
    INIT_SEARCH,
    UPDATE_STATS,
    INIT_REORDER_STATS
} from './actionTypes';

/**
 * The initial state of the feature speaker-stats.
 *
 * @type {Object}
 */
const INITIAL_STATE = {
    stats: {},
    pendingReorder: true,
    criteria: ''
};

ReducerRegistry.register('features/speaker-stats', (state = _getInitialState(), action) => {
    switch (action.type) {
    case INIT_SEARCH:
        return _updateCriteria(state, action);
    case UPDATE_STATS:
        return _updateStats(state, action);
    case INIT_REORDER_STATS:
        return _initReorderStats(state, action);
    }

    return state;
});

/**
 * Gets the initial state of the feature speaker-stats.
 *
 * @returns {Object}
 */
function _getInitialState() {
    return INITIAL_STATE;
}

/**
 * Reduces a specific Redux action INIT_SEARCH of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action INIT_SEARCH to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateCriteria(state, { criteria }) {
    return _.assign(
        {},
        state,
        { criteria },
    );
}

/**
 * Reduces a specific Redux action UPDATE_STATS of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action UPDATE_STATS to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateStats(state, { stats }) {
    const finalStats = state.pendingReorder ? stats : state.stats;

    if (!state.pendingReorder) {
        // Avoid reordering the object properties
        const finalKeys = Object.keys(stats);

        finalKeys.forEach(newStatId => {
            finalStats[newStatId] = _.clone(stats[newStatId]);
        });

        Object.keys(finalStats).forEach(key => {
            if (!finalKeys.includes(key)) {
                delete finalStats[key];
            }
        });
    }

    return _.assign(
        {},
        state,
        {
            stats: finalStats,
            pendingReorder: false
        },
    );
}

/**
 * Reduces a specific Redux action INIT_REORDER_STATS of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _initReorderStats(state) {
    return _.assign(
        {},
        state,
        { pendingReorder: true },
    );
}
