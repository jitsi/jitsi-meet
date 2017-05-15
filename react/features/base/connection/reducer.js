/* @flow */

import { assign, ReducerRegistry, set } from '../redux';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    SET_LOCATION_URL
} from './actionTypes';

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

        case SET_LOCATION_URL:
            return _setLocationURL(state, action);
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
    if (state.connection === connection) {
        return set(state, 'connection', undefined);
    }

    return state;
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
        { connection }: { connection: Object }) {
    return set(state, 'connection', connection);
}

/**
 * Constructs options to be passed to the constructor of {@code JitsiConnection}
 * based on a specific domain.
 *
 * @param {string} domain - The domain with which the returned options are to be
 * populated.
 * @private
 * @returns {Object}
 */
function _constructOptions(domain: string) {
    // FIXME The HTTPS scheme for the BOSH URL works with meet.jit.si on both
    // mobile & Web. It also works with beta.meet.jit.si on Web. Unfortunately,
    // it doesn't work with beta.meet.jit.si on mobile. Temporarily, use the
    // HTTP scheme for the BOSH URL with beta.meet.jit.si on mobile.
    let boshProtocol;

    if (domain === 'beta.meet.jit.si') {
        if (typeof window === 'object') {
            const windowLocation = window.location;

            if (windowLocation) {
                // React Native doesn't have a window.location at the time of
                // this writing, let alone a window.location.protocol.
                boshProtocol = windowLocation.protocol;
            }
        }
        boshProtocol || (boshProtocol = 'http:');
    }

    // Default to the HTTPS scheme for the BOSH URL.
    boshProtocol || (boshProtocol = 'https:');

    return {
        bosh: `${String(boshProtocol)}//${domain}/http-bind`,
        hosts: {
            domain,

            // Required by:
            // - lib-jitsi-meet/modules/xmpp/xmpp.js
            muc: `conference.${domain}`
        }
    };
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
        options: locationURL ? _constructOptions(locationURL.host) : undefined
    });
}
