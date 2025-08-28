/**
 * The type of (redux) action which signals that local media duration has changed.
 *
 * {
 *     type: UPDATE_LOCAL_TRACKS_DURATION,
 *     localTracksDuration: Object
 * }
 */
export const UPDATE_LOCAL_TRACKS_DURATION = 'UPDATE_LOCAL_TRACKS_DURATION';

/**
 * The type of (redux) action which sets the isInitialized redux prop.
 *
 * {
 *     type: SET_INITIALIZED,
 *     value: boolean
 * }
 */
export const SET_INITIALIZED = 'SET_INITIALIZED';

/**
 * The type of (redux) action which updates the initial permanent properties.
 *
 * {
 *     type: SET_INITIAL_PERMANENT_PROPERTIES,
 *     properties: Object
 * }
 */
export const SET_INITIAL_PERMANENT_PROPERTIES = 'SET_INITIAL_PERMANENT_PROPERTIES';
