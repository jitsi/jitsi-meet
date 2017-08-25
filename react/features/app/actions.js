import { setRoom } from '../base/conference';
import { setLocationURL } from '../base/connection';
import { setConfig } from '../base/config';
import { loadConfig } from '../base/lib-jitsi-meet';
import { parseURIString } from '../base/util';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';

declare var APP: Object;

/**
 * Triggers an in-app navigation to a specific route. Allows navigation to be
 * abstracted between the mobile/React Native and Web/React applications.
 *
 * @param {(string|undefined)} uri - The URI to which to navigate. It may be a
 * full URL with an HTTP(S) scheme, a full or partial URI with the app-specific
 * scheme, or a mere room name.
 * @returns {Function}
 */
export function appNavigate(uri: ?string) {
    return (dispatch: Dispatch<*>, getState: Function) =>
        _appNavigateToOptionalLocation(dispatch, getState, parseURIString(uri));
}

/**
 * Triggers an in-app navigation to a specific location URI.
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Function} getState - The redux function that gets/retrieves the redux
 * state.
 * @param {Object} newLocation - The location URI to navigate to. The value
 * cannot be undefined and is assumed to have all properties such as
 * {@code host}, {@code contextRoot}, and {@code room} defined. Depending on the
 * property, it may have a value equal to {@code undefined} and that may be
 * acceptable.
 * @private
 * @returns {void}
 */
function _appNavigateToMandatoryLocation(
        dispatch: Dispatch<*>, getState: Function,
        newLocation: Object) {
    _loadConfig(newLocation)
        .then(
            config => configLoaded(/* err */ undefined, config),
            err => configLoaded(err, /* config */ undefined))
        .then(() => dispatch(setRoom(newLocation.room)));

    /**
     * Notifies that an attempt to load a configuration has completed. Due to
     * the asynchronous nature of the loading, the specified <tt>config</tt> may
     * or may not be required by the time the notification arrives.
     *
     * @param {string|undefined} error - If the loading has failed, the error
     * detailing the cause of the failure.
     * @param {Object|undefined} config - If the loading has succeeded, the
     * loaded configuration.
     * @returns {void}
     */
    function configLoaded(error, config) {
        // FIXME Due to the asynchronous nature of the loading, the specified
        // config may or may not be required by the time the notification
        // arrives.

        if (error) {
            // XXX The failure could be, for example, because of a
            // certificate-related error. In which case the connection will
            // fail later in Strophe anyway even if we use the default
            // config here.

            // The function loadConfig will log the err.
            return;
        }

        return (
            dispatch(setLocationURL(new URL(newLocation.toString())))
                .then(() => dispatch(setConfig(config))));
    }
}

/**
 * Triggers an in-app navigation to a specific or undefined location (URI).
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Function} getState - The redux function that gets/retrieves the redux
 * state.
 * @param {Object} location - The location (URI) to navigate to. The value may
 * be undefined.
 * @private
 * @returns {void}
 */
function _appNavigateToOptionalLocation(
        dispatch: Dispatch<*>, getState: Function,
        location: Object) {
    // If the specified location (URI) does not identify a host, use the app's
    // default.
    if (!location || !location.host) {
        const defaultLocation
            = parseURIString(getState()['features/app'].app._getDefaultURL());

        if (location) {
            location.host = defaultLocation.host;

            // FIXME Turn location's host, hostname, and port properties into
            // setters in order to reduce the risks of inconsistent state.
            location.hostname = defaultLocation.hostname;
            location.port = defaultLocation.port;
            location.protocol = defaultLocation.protocol;
        } else {
            // eslint-disable-next-line no-param-reassign
            location = defaultLocation;
        }
    }

    location.protocol || (location.protocol = 'https:');

    _appNavigateToMandatoryLocation(dispatch, getState, location);
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
    return (dispatch: Dispatch<*>) => {
        dispatch({
            type: APP_WILL_MOUNT,
            app
        });

        // TODO There was a redux action creator appInit which I did not like
        // because we already had the redux action creator appWillMount and,
        // respectively, the redux action APP_WILL_MOUNT. So I set out to remove
        // appInit and managed to move everything it was doing but the
        // following. Which is not extremely bad because we haven't moved the
        // API module into its own feature yet so we're bound to work on that in
        // the future.
        typeof APP === 'object' && APP.API.init();
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
 * Loads config.js from a specific host.
 *
 * @param {Object} location - The location URI which specifies the host to load
 * the config.js from.
 * @private
 * @returns {Promise<Object>}
 */
function _loadConfig({ contextRoot, host, protocol, room }) {
    // XXX As the mobile/React Native app does not employ config on the
    // WelcomePage, do not download config.js from the deployment when
    // navigating to the WelcomePage - the perceived/visible navigation will be
    // faster.
    if (!room && typeof APP === 'undefined') {
        return Promise.resolve();
    }

    /* eslint-disable no-param-reassign */

    protocol = protocol.toLowerCase();

    // The React Native app supports an app-specific scheme which is sure to not
    // be supported by fetch (or whatever loadConfig utilizes).
    protocol !== 'http:' && protocol !== 'https:' && (protocol = 'https:');

    // TDOO userinfo

    let url = `${protocol}//${host}${contextRoot || '/'}config.js`;

    // XXX In order to support multiple shards, tell the room to the deployment.
    room && (url += `?room=${room.toLowerCase()}`);

    /* eslint-enable no-param-reassign */

    return loadConfig(url);
}
