import { setRoom } from '../base/conference';
import {
    getDomain,
    setDomain
} from '../base/connection';
import {
    loadConfig,
    setConfig
} from '../base/lib-jitsi-meet';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from './actionTypes';
import {
    _getRoomAndDomainFromUrlString,
    _getRouteToRender
} from './functions';
import './reducer';

/**
 * Triggers an in-app navigation to a different route. Allows navigation to be
 * abstracted between the mobile and web versions.
 *
 * @param {(string|undefined)} urlOrRoom - The URL or room name to which to
 * navigate.
 * @returns {Function}
 */
export function appNavigate(urlOrRoom) {
    return (dispatch, getState) => {
        const oldDomain = getDomain(getState());

        const { domain, room } = _getRoomAndDomainFromUrlString(urlOrRoom);

        // TODO Kostiantyn Tsaregradskyi: We should probably detect if user is
        // currently in a conference and ask her if she wants to close the
        // current conference and start a new one with the new room name or
        // domain.

        if (typeof domain === 'undefined' || oldDomain === domain) {
            // If both domain and room vars became undefined, that means we're
            // actually dealing with just room name and not with URL.
            dispatch(
                _setRoomAndNavigate(
                    typeof room === 'undefined' && typeof domain === 'undefined'
                        ? urlOrRoom
                        : room));
        } else if (oldDomain !== domain) {
            // Update domain without waiting for config to be loaded to prevent
            // race conditions when we will start to load config multiple times.
            dispatch(setDomain(domain));

            // If domain has changed, we need to load the config of the new
            // domain and set it, and only after that we can navigate to
            // different route.
            loadConfig(`https://${domain}`)
                .then(
                    config => configLoaded(/* err */ undefined, config),
                    err => configLoaded(err, /* config */ undefined));
        }

        /**
         * Notifies that an attempt to load the config(uration) of domain has
         * completed.
         *
         * @param {string|undefined} err - If the loading has failed, the error
         * detailing the cause of the failure.
         * @param {Object|undefined} config - If the loading has succeeded, the
         * loaded config(uration).
         * @returns {void}
         */
        function configLoaded(err, config) {
            if (err) {
                // XXX The failure could be, for example, because of a
                // certificate-related error. In which case the connection will
                // fail later in Strophe anyway even if we use the default
                // config here.

                // The function loadConfig will log the err.
                return;
            }

            // We set room name only here to prevent race conditions on app
            // start to not make app re-render conference page for two times.
            dispatch(setRoom(room));
            dispatch(setConfig(config));
            _navigate(getState());
        }
    };
}

/**
 * Signals that a specific App will mount (in the terms of React).
 *
 * @param {App} app - The App which will mount.
 * @returns {{
 *     type: APP_WILL_MOUNT,
 *     app: App
 * }}
 */
export function appWillMount(app) {
    return {
        type: APP_WILL_MOUNT,
        app
    };
}

/**
 * Signals that a specific App will unmount (in the terms of React).
 *
 * @param {App} app - The App which will unmount.
 * @returns {{
 *     type: APP_WILL_UNMOUNT,
 *     app: App
 * }}
 */
export function appWillUnmount(app) {
    return {
        type: APP_WILL_UNMOUNT,
        app
    };
}

/**
 * Navigates to route corresponding to current room name.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {void}
 */
function _navigate(state) {
    const app = state['features/app'].app;
    const routeToRender = _getRouteToRender(state);

    app._navigate(routeToRender);
}

/**
 * Sets room and navigates to new route if needed.
 *
 * @param {string} newRoom - New room name.
 * @private
 * @returns {Function}
 */
function _setRoomAndNavigate(newRoom) {
    return (dispatch, getState) => {
        const oldRoom = getState()['features/base/conference'].room;

        dispatch(setRoom(newRoom));

        const state = getState();
        const room = state['features/base/conference'].room;

        if (room !== oldRoom) {
            _navigate(state);
        }
    };
}
