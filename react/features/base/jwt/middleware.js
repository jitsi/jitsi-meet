// @flow

import jwtDecode from 'jwt-decode';

import { SET_CONFIG } from '../config';
import { SET_LOCATION_URL } from '../connection';
import {
    getLocalParticipant,
    participantUpdated
} from '../participants';
import { MiddlewareRegistry } from '../redux';

import { SET_JWT } from './actionTypes';
import { setJWT } from './actions';
import { parseJWTFromURLParams } from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Middleware to parse token data upon setting a new room URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG:
    case SET_LOCATION_URL:
        // XXX The JSON Web Token (JWT) is not the only piece of state that we
        // have decided to store in the feature jwt
        return _setConfigOrLocationURL(store, next, action);

    case SET_JWT:
        return _setJWT(store, next, action);
    }

    return next(action);
});

/**
 * Overwrites the properties {@code avatarURL}, {@code email}, and {@code name}
 * of the local participant stored in the redux state base/participants.
 *
 * @param {Store} store - The redux store.
 * @param {Object} localParticipant - The {@code Participant} structure to
 * overwrite the local participant stored in the redux store base/participants
 * with.
 * @private
 * @returns {void}
 */
function _overwriteLocalParticipant(
        { dispatch, getState },
        { avatarURL, email, name, features }) {
    let localParticipant;

    if ((avatarURL || email || name)
            && (localParticipant = getLocalParticipant(getState))) {
        const newProperties: Object = {
            id: localParticipant.id,
            local: true
        };

        if (avatarURL) {
            newProperties.avatarURL = avatarURL;
        }
        if (email) {
            newProperties.email = email;
        }
        if (name) {
            newProperties.name = name;
        }
        if (features) {
            newProperties.features = features;
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

    dispatch(
        setJWT(locationURL ? parseJWTFromURLParams(locationURL) : undefined));

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

    if (!Object.keys(actionPayload).length) {
        if (jwt) {
            let jwtPayload;

            try {
                jwtPayload = jwtDecode(jwt);
            } catch (e) {
                logger.error(e);
            }

            if (jwtPayload) {
                const { context, iss } = jwtPayload;

                action.jwt = jwt;
                action.issuer = iss;
                if (context) {
                    const user = _user2participant(context.user || {});

                    action.callee = context.callee;
                    action.group = context.group;
                    action.server = context.server;
                    action.tenant = context.tenant;
                    action.user = user;

                    user && _overwriteLocalParticipant(
                        store, { ...user,
                            features: context.features });
                }
            }
        } else if (typeof APP === 'undefined') {
            // The logic of restoring JWT overrides make sense only on mobile.
            // On Web it should eventually be restored from storage, but there's
            // no such use case yet.

            const { user } = store.getState()['features/base/jwt'];

            user && _undoOverwriteLocalParticipant(store, user);
        }
    }

    return next(action);
}

/**
 * Undoes/resets the values overwritten by {@link _overwriteLocalParticipant}
 * by either clearing them or setting to default values. Only the values that
 * have not changed since the overwrite happened will be restored.
 *
 * NOTE Once it is possible to edit and save participant properties, this
 * function should restore values from the storage instead.
 *
 * @param {Store} store - The redux store.
 * @param {Object} localParticipant - The {@code Participant} structure used
 * previously to {@link _overwriteLocalParticipant}.
 * @private
 * @returns {void}
 */
function _undoOverwriteLocalParticipant(
        { dispatch, getState },
        { avatarURL, name, email }) {
    let localParticipant;

    if ((avatarURL || name || email)
            && (localParticipant = getLocalParticipant(getState))) {
        const newProperties: Object = {
            id: localParticipant.id,
            local: true
        };

        if (avatarURL === localParticipant.avatarURL) {
            newProperties.avatarURL = undefined;
        }
        if (email === localParticipant.email) {
            newProperties.email = undefined;
        }
        if (name === localParticipant.name) {
            newProperties.name = undefined;
        }
        newProperties.features = undefined;

        dispatch(participantUpdated(newProperties));
    }
}

/**
 * Converts the JWT {@code context.user} structure to the {@code Participant}
 * structure stored in the redux state base/participants.
 *
 * @param {Object} user - The JWT {@code context.user} structure to convert.
 * @private
 * @returns {{
 *     avatarURL: ?string,
 *     email: ?string,
 *     id: ?string,
 *     name: ?string
 * }}
 */
function _user2participant({ avatar, avatarUrl, email, id, name }) {
    const participant = {};

    if (typeof avatarUrl === 'string') {
        participant.avatarURL = avatarUrl.trim();
    } else if (typeof avatar === 'string') {
        participant.avatarURL = avatar.trim();
    }
    if (typeof email === 'string') {
        participant.email = email.trim();
    }
    if (typeof id === 'string') {
        participant.id = id.trim();
    }
    if (typeof name === 'string') {
        participant.name = name.trim();
    }

    return Object.keys(participant).length ? participant : undefined;
}
