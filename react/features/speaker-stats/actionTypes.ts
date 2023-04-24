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
 *     getSpeakerStats: Function
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
 * Action type to update the speaker stats order.
 * {
 *     type: UPDATE_SORTED_SPEAKER_STATS_IDS
 * }
 */
export const UPDATE_SORTED_SPEAKER_STATS_IDS = 'UPDATE_SORTED_SPEAKER_STATS_IDS'

/**
 * Action type to initiate reordering of the stats.
 *
 * {
 *     type: INIT_REORDER_STATS
 * }
 */
export const INIT_REORDER_STATS = 'INIT_REORDER_STATS';

/**
 * Action type to reset the search criteria.
 *
 * {
 *     type: RESET_SEARCH_CRITERIA
 * }
 */
export const RESET_SEARCH_CRITERIA = 'RESET_SEARCH_CRITERIA'

/**
 * Action type to toggle the face expressions grid.
 * {
 *     type: TOGGLE_FACE_EXPRESSIONS
 * }
 */
export const TOGGLE_FACE_EXPRESSIONS = 'SHOW_FACE_EXPRESSIONS';


export const INCREASE_ZOOM = 'INCREASE_ZOOM';

export const DECREASE_ZOOM = 'DECREASE_ZOOM';

export const ADD_TO_OFFSET = 'ADD_TO_OFFSET';

export const SET_OFFSET = 'RESET_OFFSET';

export const ADD_TO_OFFSET_LEFT = 'ADD_TO_OFFSET_LEFT';

export const ADD_TO_OFFSET_RIGHT = 'ADD_TO_OFFSET_RIGHT';

export const SET_TIMELINE_BOUNDARY = 'SET_TIMELINE_BOUNDARY';

export const SET_PANNING = 'SET_PANNING';

