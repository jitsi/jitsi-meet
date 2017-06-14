import jwtDecode from 'jwt-decode';

import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_LEAVE,
    SET_ROOM
} from '../base/conference';
import { SET_CONFIG } from '../base/config';
import { SET_LOCATION_URL } from '../base/connection';
import { LIB_INIT_ERROR } from '../base/lib-jitsi-meet';
import { PARTICIPANT_JOINED } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import { setCallOverlayVisible, setJWT } from './actions';
import { SET_JWT } from './actionTypes';
import { parseJWTFromURLParams } from './functions';

/**
 * Middleware to parse token data upon setting a new room URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
    case CONFERENCE_WILL_LEAVE:
    case LIB_INIT_ERROR:
    case PARTICIPANT_JOINED:
    case SET_ROOM:
        return _maybeSetCallOverlayVisible(store, next, action);

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
 * Notifies the feature jwt that a specific {@code action} is being dispatched
 * within a specific redux {@code store} which may have an effect on the
 * visiblity of (the) {@code CallOverlay}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action which is being dispatched in the
 * specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _maybeSetCallOverlayVisible({ dispatch, getState }, next, action) {
    const result = next(action);

    const state = getState();
    const stateFeaturesJWT = state['features/jwt'];
    let callOverlayVisible;

    if (stateFeaturesJWT.callee) {
        const { conference, leaving, room } = state['features/base/conference'];

        // XXX The CallOverlay is to be displayed/visible as soon as
        // possible including even before the conference is joined.
        if (room && (!conference || conference !== leaving)) {
            switch (action.type) {
            case CONFERENCE_FAILED:
            case CONFERENCE_LEFT:
            case CONFERENCE_WILL_LEAVE:
            case LIB_INIT_ERROR:
                // Because the CallOverlay is to be displayed/visible as soon as
                // possible even before the connection is established and/or the
                // conference is joined, it is very complicated to figure out
                // based on the current state alone. In order to reduce the
                // risks of displaying the CallOverly at inappropirate times, do
                // not even attempt to figure out based on the current state.
                // The (redux) actions listed above are also the equivalents of
                // the execution ponints at which APP.UI.hideRingOverlay() used
                // to be invoked.
                break;

            default: {
                // The CallOverlay it to no longer be displayed/visible as soon
                // as another participant joins.
                const participants = state['features/base/participants'];

                callOverlayVisible
                    = Boolean(
                        participants
                            && participants.length === 1
                            && participants[0].local);

                // However, the CallDialog is not to be displayed/visible again
                // after all remote participants leave.
                if (callOverlayVisible
                        && stateFeaturesJWT.callOverlayVisible === false) {
                    callOverlayVisible = false;
                }
                break;
            }
            }
        }
    }
    dispatch(setCallOverlayVisible(callOverlayVisible));

    return result;
}

/**
 * Notifies the feature jwt that the action {@link SET_CONFIG} or
 * {@link SET_LOCATION_URL} is being dispatched within a specific redux
 * {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_CONFIG} or
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
        jwt = parseJWTFromURLParams(locationURL);
    }
    dispatch(setJWT(jwt));

    return result;
}

/**
 * Notifies the feature jwt that the action {@link SET_JWT} is being dispatched
 * within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_JWT} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setJWT(store, next, action) {
    // eslint-disable-next-line no-unused-vars
    const { jwt, type, ...actionPayload } = action;

    if (jwt && !Object.keys(actionPayload).length) {
        const {
            enableUserRolesBasedOnToken
        } = store.getState()['features/base/config'];

        action.isGuest = !enableUserRolesBasedOnToken;

        const jwtPayload = jwtDecode(jwt);

        if (jwtPayload) {
            const { context, iss } = jwtPayload;

            action.jwt = jwt;
            action.issuer = iss;
            if (context) {
                action.callee = context.callee;
                action.caller = context.user;
                action.group = context.group;
                action.server = context.server;
            }
        }
    }

    return _maybeSetCallOverlayVisible(store, next, action);
}
