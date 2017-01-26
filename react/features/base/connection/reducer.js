import { ReducerRegistry, setStateProperty } from '../redux';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    SET_DOMAIN
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature base/connection.
 */
ReducerRegistry.register('features/base/connection', (state = {}, action) => {
    switch (action.type) {
    case CONNECTION_DISCONNECTED:
        return _connectionDisconnected(state, action);

    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(state, action);

    case SET_DOMAIN:
        return _setDomain(state, action);
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
function _connectionDisconnected(state, action) {
    if (state.connection === action.connection) {
        return setStateProperty(state, 'connection', undefined);
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
function _connectionEstablished(state, action) {
    return setStateProperty(state, 'connection', action.connection);
}

/**
 * Constructs options to be passed to the constructor of JitsiConnection based
 * on a specific domain.
 *
 * @param {string} domain - The domain with which the returned options are to be
 * populated.
 * @returns {Object}
 */
function _constructConnectionOptions(domain) {
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
        bosh: `${boshProtocol}//${domain}/http-bind`,
        hosts: {
            domain,
            focus: `focus.${domain}`,
            muc: `conference.${domain}`
        }
    };
}

/**
 * Reduces a specific Redux action SET_DOMAIN of the feature base/connection.
 *
 * @param {Object} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action SET_DOMAIN to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setDomain(state, action) {
    return {
        ...state,
        connectionOptions: {
            ...state.connectionOptions,
            ..._constructConnectionOptions(action.domain)
        }
    };
}
