/* @flow */

import { SET_ROOM } from '../conference';
import { JitsiConnectionErrors } from '../lib-jitsi-meet';
import { assign, ReducerRegistry } from '../redux';
import { parseURIString } from '../util';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT,
    SET_LOCATION_URL
} from './actionTypes';

import type { ConnectionFailedError } from './actions.native';

/**
 * Reduces the Redux actions of the feature base/connection.
 */
ReducerRegistry.register(
    'features/base/connection',
    (state: Object = {}, action: Object) => {
        switch (action.type) {
        case CONNECTION_DISCONNECTED:
            return _connectionDisconnected(state, action);

        case CONNECTION_ESTABLISHED:
            return _connectionEstablished(state, action);

        case CONNECTION_FAILED:
            return _connectionFailed(state, action);

        case CONNECTION_WILL_CONNECT:
            return _connectionWillConnect(state, action);

        case SET_LOCATION_URL:
            return _setLocationURL(state, action);

        case SET_ROOM:
            return _setRoom(state);
        }

        return state;
    });

/**
 * Reduces a specific Redux action CONNECTION_DISCONNECTED of the feature
 * base/connection.
 *
 * @param {Object} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_DISCONNECTED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionDisconnected(
        state: Object,
        { connection }: { connection: Object }) {
    const connection_ = _getCurrentConnection(state);

    if (connection_ !== connection) {
        return state;
    }

    return assign(state, {
        connecting: undefined,
        connection: undefined,
        timeEstablished: undefined
    });
}

/**
 * Reduces a specific Redux action CONNECTION_ESTABLISHED of the feature
 * base/connection.
 *
 * @param {Object} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_ESTABLISHED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionEstablished(
        state: Object,
        { connection, timeEstablished }: {
            connection: Object,
            timeEstablished: number
        }) {
    return assign(state, {
        connecting: undefined,
        connection,
        error: undefined,
        passwordRequired: undefined,
        timeEstablished
    });
}

/**
 * Reduces a specific Redux action CONNECTION_FAILED of the feature
 * base/connection.
 *
 * @param {Object} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_FAILED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionFailed(
        state: Object,
        { connection, error }: {
            connection: Object,
            error: ConnectionFailedError
        }) {
    const connection_ = _getCurrentConnection(state);

    if (connection_ && connection_ !== connection) {
        return state;
    }

    return assign(state, {
        connecting: undefined,
        connection: undefined,
        error,
        passwordRequired:
            error.name === JitsiConnectionErrors.PASSWORD_REQUIRED
                ? connection : undefined
    });
}

/**
 * Reduces a specific Redux action CONNECTION_WILL_CONNECT of the feature
 * base/connection.
 *
 * @param {Object} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_WILL_CONNECT to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionWillConnect(
        state: Object,
        { connection }: { connection: Object }) {
    return assign(state, {
        connecting: connection,

        // We don't care if the previous connection has been closed already,
        // because it's an async process and there's no guarantee if it'll be
        // done before the new one is established.
        connection: undefined,
        error: undefined,
        passwordRequired: undefined,
        timeEstablished: undefined
    });
}

/**
 * Constructs options to be passed to the constructor of {@code JitsiConnection}
 * based on a specific location URL.
 *
 * @param {string} locationURL - The location URL with which the returned
 * options are to be constructed.
 * @private
 * @returns {Object} The options to be passed to the constructor of
 * {@code JitsiConnection} based on the location URL.
 */
function _constructOptions(locationURL: URL) {
    const locationURI = parseURIString(locationURL.href);

    // FIXME The HTTPS scheme for the BOSH URL works with meet.jit.si on both
    // mobile & Web. It also works with beta.meet.jit.si on Web. Unfortunately,
    // it doesn't work with beta.meet.jit.si on mobile. Temporarily, use the
    // HTTP scheme for the BOSH URL with beta.meet.jit.si on mobile.
    let { protocol } = locationURI;
    const domain = locationURI.hostname;

    if (!protocol && domain === 'beta.meet.jit.si') {
        const windowLocation = window.location;

        windowLocation && (protocol = windowLocation.protocol);
        protocol || (protocol = 'http:');
    }

    // Default to the HTTPS scheme for the BOSH URL.
    protocol || (protocol = 'https:');

    return {
        bosh:
            `${String(protocol)}//${domain}${
                locationURI.contextRoot || '/'}http-bind`,
        hosts: {
            domain,

            // Required by:
            // - lib-jitsi-meet/modules/xmpp/xmpp.js
            muc: `conference.${domain}`
        }
    };
}

/**
 * The current (similar to getCurrentConference in base/conference/functions.js)
 * connection which is {@code connection} or {@code connecting}.
 *
 * @param {Object} baseConnectionState - The current state of the
 * {@code 'base/connection'} feature.
 * @returns {JitsiConnection} - The current {@code JitsiConnection} if any.
 * @private
 */
function _getCurrentConnection(baseConnectionState: Object): ?Object {
    return baseConnectionState.connection || baseConnectionState.connecting;
}

/**
 * Reduces a specific redux action {@link SET_LOCATION_URL} of the feature
 * base/connection.
 *
 * @param {Object} state - The redux state of the feature base/connection.
 * @param {Action} action - The redux action {@code SET_LOCATION_URL} to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setLocationURL(
        state: Object,
        { locationURL }: { locationURL: ?URL }) {
    return assign(state, {
        locationURL,
        options: locationURL ? _constructOptions(locationURL) : undefined
    });
}

/**
 * Reduces a specific redux action {@link SET_ROOM} of the feature
 * base/connection.
 *
 * @param {Object} state - The redux state of the feature base/connection.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setRoom(state: Object) {
    return assign(state, {
        error: undefined,
        passwordRequired: undefined
    });
}
