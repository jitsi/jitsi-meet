// @flow

/**
 * Action type to start search.
 *
 * {
 *     type: INIT_SEARCH
 * }
 */
export const INIT_SEARCH = 'INIT_SEARCH';

/**
 * Action type to start stats retrieval.
 *
 * {
 *     type: INIT_UPDATE_STATS,
 *     reorder: boolean
 * }
 */
export const INIT_UPDATE_STATS = 'INIT_UPDATE_STATS';

/**
 * Action type to update stats.
 *
 * {
 *     type: UPDATE_STATS,
 *     stats: Object
 * }
 */
export const UPDATE_STATS = 'UPDATE_STATS';

/**
 * Action type to reorder stats.
 *
 * {
 *     type: REORDER_STATS,
 *     stats: Object
 * }
 *
 * @protected
 */
export const REORDER_STATS = 'REORDER_STATS';
