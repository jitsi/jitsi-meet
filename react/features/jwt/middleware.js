import jwtDecode from 'jwt-decode';

import { parseURLParams, SET_CONFIG } from '../base/config';
import { SET_LOCATION_URL } from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

import { setJWT } from './actions';
import { SET_JWT } from './actionTypes';

/**
 * Middleware to parse token data upon setting a new room URL.
 *
 * @param {Store} store - The Redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG:
    case SET_LOCATION_URL:
        // XXX The JSON Web Token (JWT) is not the only piece of state that we
        // have decided to store in the feature jwt, there is isGuest as well
        // which depends on the states of the features base/config and jwt. So
        // the JSON Web Token comes from the conference/room's URL and isGuest
        // needs a recalculation upon SET_CONFIG as well.
        return _setConfigOrLocationURL(store, next, action);

    case SET_JWT:
        return _setJWT(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature jwt that the action {@link SET_CONFIG} or
 * {@link SET_LOCATION_URL} is being dispatched within a specific Redux
 * {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code SET_CONFIG} or
 * {@code SET_LOCATION_URL} which is being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setConfigOrLocationURL({ dispatch, getState }, next, action) {
    const result = next(action);

    const { locationURL } = getState()['features/base/connection'];
    let jwt;

    if (locationURL) {
        jwt = parseURLParams(locationURL, true, 'search').jwt;
    }
    dispatch(setJWT(jwt));

    return result;
}

/**
 * Notifies the feature jwt that the action {@link SET_JWT} is being dispatched
 * within a specific Redux {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code SET_JWT} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setJWT({ getState }, next, action) {
    // eslint-disable-next-line no-unused-vars
    const { jwt, type, ...actionPayload } = action;

    if (jwt && !Object.keys(actionPayload).length) {
        const {
            enableUserRolesBasedOnToken
        } = getState()['features/base/config'];

        action.isGuest = !enableUserRolesBasedOnToken;

        const jwtPayload = jwtDecode(jwt);

        if (jwtPayload) {
            const { context, iss } = jwtPayload;

            action.issuer = iss;
            if (context) {
                action.callee = context.callee;
                action.caller = context.user;
                action.group = context.group;
                action.server = context.server;
            }
        }
    }

    return next(action);
}
