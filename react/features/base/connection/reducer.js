import { ReducerRegistry } from '../redux';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    SET_DOMAIN
} from './actionTypes';

/**
 * Initial Redux state.
 *
 * @type {{
 *      jitsiConnection: (JitsiConnection|null),
 *      connectionOptions: Object
 *  }}
 */
const INITIAL_STATE = {
    jitsiConnection: null,
    connectionOptions: null
};

/**
 * Listen for actions that contain the connection object, so that
 * it can be stored for use by other action creators.
 */
ReducerRegistry.register('features/base/connection',
    (state = INITIAL_STATE, action) => {
        switch (action.type) {
        case CONNECTION_DISCONNECTED:
            if (state.jitsiConnection === action.connection) {
                return {
                    ...state,
                    jitsiConnection: null
                };
            }

            return state;

        case CONNECTION_ESTABLISHED:
            return {
                ...state,
                jitsiConnection: action.connection
            };

        case SET_DOMAIN:
            return {
                ...state,
                connectionOptions: {
                    ...state.connectionOptions,
                    ...buildConnectionOptions(action.domain)
                }
            };

        default:
            return state;
        }
    });

/**
 * Builds connection options based on domain.
 *
 * @param {string} domain - Domain name.
 * @returns {Object}
 */
function buildConnectionOptions(domain) {
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
        if (!boshProtocol) {
            boshProtocol = 'http:';
        }
    }

    // Default to the HTTPS scheme for the BOSH URL.
    if (!boshProtocol) {
        boshProtocol = 'https:';
    }

    return {
        bosh: `${boshProtocol}//${domain}/http-bind`,
        hosts: {
            domain,
            focus: `focus.${domain}`,
            muc: `conference.${domain}`
        }
    };
}
