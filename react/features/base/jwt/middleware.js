import jwtDecode from 'jwt-decode';

import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_LEAVE,
    SET_ROOM
} from '../conference';
import { SET_CONFIG } from '../config';
import { SET_LOCATION_URL } from '../connection';
import { LIB_INIT_ERROR } from '../lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipantCount,
    LOCAL_PARTICIPANT_DEFAULT_NAME,
    PARTICIPANT_JOINED,
    participantUpdated
} from '../participants';
import { MiddlewareRegistry } from '../redux';

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
    const stateFeaturesJWT = state['features/base/jwt'];
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
                callOverlayVisible = getParticipantCount(state) === 1
                    && Boolean(getLocalParticipant(state));

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
 * Converts 'context.user' JWT token structure to the format compatible with the
 * corresponding fields overridden in base/participants.
 *
 * @param {Object} user - The 'jwt.context.user' structure parsed from the JWT
 * token.
 * @returns {({
 *      avatarURL: string?,
 *      email: string?,
 *      name: string?
 * })}
 * @private
 */
function _normalizeCallerFields(user) {
    const { avatar, avatarUrl, email, name } = user;
    const caller = { };

    if (typeof (avatarUrl || avatar) === 'string') {
        caller.avatarURL = (avatarUrl || avatar).trim();
    }
    if (typeof email === 'string') {
        caller.email = email.trim();
    }
    if (typeof name === 'string') {
        caller.name = name.trim();
    }

    return Object.keys(caller).length ? caller : undefined;
}

/**
 * Eventually overwrites 'avatarURL', 'email' and 'name' fields with the values
 * from JWT token for the local participant stored in the 'base/participants'
 * Redux store by dispatching the participant updated action.
 *
 * @param {Store} store - The redux store.
 * @param {Object} caller - The "caller" structure parsed from 'context.user'
 * part of the JWT token and then normalized using
 * {@link _normalizeCallerFields}.
 * @returns {void}
 * @private
 */
function _overwriteLocalParticipant({ dispatch, getState }, caller) {
    const { avatarURL, email, name } = caller;
    const localParticipant = getLocalParticipant(getState());

    if (localParticipant && (avatarURL || email || name)) {
        const newProperties = { id: localParticipant.id };

        if (avatarURL) {
            newProperties.avatarURL = avatarURL;
        }
        if (email) {
            newProperties.email = email;
        }
        if (name) {
            newProperties.name = name;
        }
        dispatch(participantUpdated(newProperties));
    }
}

/**
 * Will reset the values overridden by {@link _overwriteLocalParticipant}
 * by either clearing them or setting to default values. Only the values that
 * have not changed since the override happened will be restored.
 *
 * NOTE Once there is the possibility to edit and save participant properties,
 * this method should restore values from the storage instead.
 *
 * @param {Store} store - The Redux store.
 * @param {Object} caller - The 'caller' part of the JWT Redux state which tells
 * which local participant's fields's been overridden when the JWT token was
 * set.
 * @returns {void}
 * @private
 */
function _resetLocalParticipantOverrides({ dispatch, getState }, caller) {
    const { avatarURL, name, email } = caller;
    const localParticipant = getLocalParticipant(getState());

    if (localParticipant && (avatarURL || name || email)) {
        const newProperties = { id: localParticipant.id };

        if (avatarURL === localParticipant.avatarURL) {
            newProperties.avatarURL = undefined;
        }
        if (name === localParticipant.name) {
            newProperties.name = LOCAL_PARTICIPANT_DEFAULT_NAME;
        }
        if (email === localParticipant.email) {
            newProperties.email = undefined;
        }
        dispatch(participantUpdated(newProperties));
    }
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
                action.caller = _normalizeCallerFields(context.user);
                action.group = context.group;
                action.server = context.server;

                if (action.caller) {
                    _overwriteLocalParticipant(store, action.caller);
                }
            }
        }
    } else if (!jwt && !Object.keys(actionPayload).length) {
        const jwtState = store.getState()['features/base/jwt'];

        // The logic of restoring JWT overrides make sense only on mobile. On
        // web it should eventually be restored from storage, but there's no
        // such use case yet.
        if (jwtState.caller && typeof APP === 'undefined') {
            _resetLocalParticipantOverrides(store, jwtState.caller);
        }
    }

    return _maybeSetCallOverlayVisible(store, next, action);
}
