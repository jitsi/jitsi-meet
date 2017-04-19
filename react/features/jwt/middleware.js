import { SET_ROOM_URL } from '../base/conference';
import { getConfigParamsFromUrl } from '../base/config';
import { MiddlewareRegistry } from '../base/redux';

import { setTokenData } from './actions';
import TokenData from './TokenData';

/**
 * Middleware that parsing token data after setting new room URL.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 * @private
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM_URL:
        return _parseTokenData(store, next, action);
    }

    return next(action);
});

/**
 * Parses token data from room URL and if it's found stores into Redux
 * store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_ROOM_URL which is being
 * dispatched in the specified store.
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 * @private
 */
function _parseTokenData(store, next, action) {
    const { config } = store.getState()['features/base/lib-jitsi-meet'];
    const { roomUrl } = action;
    let params = {};

    if (roomUrl) {
        params = getConfigParamsFromUrl(roomUrl, true, 'search');
    }

    const { jwt } = params;
    let parsedToken = {};

    if (jwt) {
        parsedToken = new TokenData(jwt);
    }

    parsedToken.isGuest = !config.enableUserRolesBasedOnToken;

    store.dispatch(setTokenData(parsedToken));

    return next(action);
}
