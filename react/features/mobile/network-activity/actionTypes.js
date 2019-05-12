/**
 * The type of redux action to add a network request to the redux store/state.
 *
 * {
 *     type: _ADD_NETWORK_REQUEST,
 *     request: Object
 * }
 *
 * @protected
 */
export const _ADD_NETWORK_REQUEST = '_ADD_NETWORK_REQUEST';

/**
 * The type of redux action to remove all network requests from the redux
 * store/state.
 *
 * {
 *     type: _REMOVE_ALL_NETWORK_REQUESTS,
 * }
 *
 * @protected
 */
export const _REMOVE_ALL_NETWORK_REQUESTS
    = '_REMOVE_ALL_NETWORK_REQUESTS';

/**
 * The type of redux action to remove a network request from the redux
 * store/state.
 *
 * {
 *     type: _REMOVE_NETWORK_REQUEST,
 *     request: Object
 * }
 *
 * @protected
 */
export const _REMOVE_NETWORK_REQUEST = '_REMOVE_NETWORK_REQUEST';
