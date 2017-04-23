import { setRoom } from '../base/conference';
import { setConfig } from '../base/config';
import { getDomain, setDomain } from '../base/connection';
import { loadConfig } from '../base/lib-jitsi-meet';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';
import {
    _getRouteToRender,
    _parseURIString,
    init
} from './functions';

/**
 * Temporary solution. Should dispatch actions related to initial settings of
 * the app like setting log levels, reading the config parameters from query
 * string etc.
 *
 * @returns {Function}
 */
export function appInit() {
    return () => init();
}

/**
 * Triggers an in-app navigation to a different route. Allows navigation to be
 * abstracted between the mobile and web versions.
 *
 * @param {(string|undefined)} uri - The URI to which to navigate. It may be a
 * full URL with an http(s) scheme, a full or partial URI with the app-specific
 * sheme, or a mere room name.
 * @returns {Function}
 */
export function appNavigate(uri) {
    return (dispatch, getState) => {
        const state = getState();
        const oldDomain = getDomain(state);

        // eslint-disable-next-line prefer-const
        let { domain, room } = _parseURIString(uri);

        // If the specified URI does not identify a domain, use the app's
        // default.
        if (typeof domain === 'undefined') {
            domain
                = _parseURIString(state['features/app'].app._getDefaultURL())
                    .domain;
        }

        // TODO Kostiantyn Tsaregradskyi: We should probably detect if user is
        // currently in a conference and ask her if she wants to close the
        // current conference and start a new one with the new room name or
        // domain.

        if (typeof domain === 'undefined' || oldDomain === domain) {
            dispatchSetRoomAndNavigate();
        } else if (oldDomain !== domain) {
            // Update domain without waiting for config to be loaded to prevent
            // race conditions when we will start to load config multiple times.
            dispatch(setDomain(domain));

            // If domain has changed, we need to load the config of the new
            // domain and set it, and only after that we can navigate to a
            // different route.
            loadConfig(`https://${domain}`)
                .then(
                    config => configLoaded(/* err */ undefined, config),
                    err => configLoaded(err, /* config */ undefined))
                .then(dispatchSetRoomAndNavigate);
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

            dispatch(setConfig(config));
        }

        /**
         * Dispatches _setRoomAndNavigate in the Redux store.
         *
         * @returns {void}
         */
        function dispatchSetRoomAndNavigate() {
            // If both domain and room vars became undefined, that means we're
            // actually dealing with just room name and not with URL.
            dispatch(
                _setRoomAndNavigate(
                    typeof room === 'undefined' && typeof domain === 'undefined'
                        ? uri
                        : room));
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
 * Navigates to a route in accord with a specific Redux state.
 *
 * @param {Object} state - The Redux state which determines/identifies the route
 * to navigate to.
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
        dispatch(setRoom(newRoom));
        _navigate(getState());
    };
}
