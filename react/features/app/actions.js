// @flow

import type { Dispatch } from 'redux';

import { setRoom } from '../base/conference';
import {
    configWillLoad,
    loadConfigError,
    restoreConfig,
    setConfig,
    storeConfig
} from '../base/config';
import { setLocationURL } from '../base/connection';
import { loadConfig } from '../base/lib-jitsi-meet';
import { parseURIString, toURLString } from '../base/util';
import { setFatalError } from '../overlay';

import { getDefaultURL } from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var APP: Object;

/**
 * Triggers an in-app navigation to a specific route. Allows navigation to be
 * abstracted between the mobile/React Native and Web/React applications.
 *
 * @param {string|undefined} uri - The URI to which to navigate. It may be a
 * full URL with an HTTP(S) scheme, a full or partial URI with the app-specific
 * scheme, or a mere room name.
 * @returns {Function}
 */
export function appNavigate(uri: ?string) {
    return (dispatch: Dispatch<any>, getState: Function) =>
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
 * @returns {Promise<void>}
 */
function _appNavigateToMandatoryLocation(
        dispatch: Dispatch<any>, getState: Function,
        newLocation: Object
): Promise<void> {
    const { room } = newLocation;
    const locationURL = new URL(newLocation.toString());

    dispatch(configWillLoad(locationURL));

    return (
        _loadConfig(dispatch, getState, newLocation)
            .then(
                config => loadConfigSettled(/* error */ undefined, config),
                error => loadConfigSettled(error, /* config */ undefined))
            .then(() => dispatch(setRoom(room))));

    /**
     * Notifies that an attempt to load a configuration has completed. Due to
     * the asynchronous nature of the loading, the specified {@code config} may
     * or may not be required by the time the notification arrives.
     *
     * @param {string|undefined} error - If the loading has failed, the error
     * detailing the cause of the failure.
     * @param {Object|undefined} config - If the loading has succeeded, the
     * loaded configuration.
     * @returns {void}
     */
    function loadConfigSettled(error, config) {
        // Due to the asynchronous nature of the loading, the specified config
        // may or may not be required by the time the notification arrives. If
        // we receive the config for a location we are no longer interested in,
        // "ignore" it - deliver it to the external API, for example, but do not
        // proceed with the appNavigate procedure/process.
        if (getState()['features/base/config'].locationURL === locationURL) {
            dispatch(setLocationURL(locationURL));
            dispatch(setConfig(config));
        } else {
            // eslint-disable-next-line no-param-reassign
            error || (error = new Error('Config no longer needed!'));

            // XXX The failure could be, for example, because of a
            // certificate-related error. In which case the connection will fail
            // later in Strophe anyway.
            dispatch(loadConfigError(error, locationURL));

            throw error;
        }
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
        dispatch: Dispatch<any>, getState: Function,
        location: Object) {
    // If the specified location (URI) does not identify a host, use the app's
    // default.
    if (!location || !location.host) {
        const defaultLocation = parseURIString(getDefaultURL(getState));

        if (location) {
            location.host = defaultLocation.host;

            // FIXME Turn location's host, hostname, and port properties into
            // setters in order to reduce the risks of inconsistent state.
            location.hostname = defaultLocation.hostname;
            location.pathname
                = defaultLocation.pathname + location.pathname.substr(1);
            location.port = defaultLocation.port;
            location.protocol = defaultLocation.protocol;
        } else {
            // eslint-disable-next-line no-param-reassign
            location = defaultLocation;
        }
    }

    location.protocol || (location.protocol = 'https:');

    return _appNavigateToMandatoryLocation(dispatch, getState, location);
}

/**
 * Loads config.js from a specific host.
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Function} getState - The redux {@code getState} function.
 * @param {Object} location - The location URI which specifies the host to load
 * the config.js from.
 * @private
 * @returns {Promise<Object>}
 */
function _loadConfig(
        dispatch: Dispatch<any>,
        getState: Function,
        { contextRoot, host, protocol, room }) {
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

    const baseURL = `${protocol}//${host}${contextRoot || '/'}`;
    let url = `${baseURL}config.js`;

    // XXX In order to support multiple shards, tell the room to the deployment.
    room && (url += `?room=${room.toLowerCase()}`);

    /* eslint-enable no-param-reassign */

    return loadConfig(url).then(
        /* onFulfilled */ config => {
            // FIXME If the config is no longer needed (in the terms of
            // _loadConfig) and that happened because of an intervening
            // _loadConfig for the same baseURL, then the unneeded config may be
            // stored after the needed config. Anyway.
            dispatch(storeConfig(baseURL, config));

            return config;
        },
        /* onRejected */ error => {
            // XXX The (down)loading of config failed. Try to use the last
            // successfully fetched for that deployment. It may not match the
            // shard.
            const config = restoreConfig(baseURL);

            if (config) {
                return config;
            }

            throw error;
        });
}

/**
 * Redirects to another page generated by replacing the path in the original URL
 * with the given path.
 *
 * @param {(string)} pathname - The path to navigate to.
 * @returns {Function}
 */
export function redirectWithStoredParams(pathname: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { locationURL } = getState()['features/base/connection'];
        const newLocationURL = new URL(locationURL.href);

        newLocationURL.pathname = pathname;
        window.location.assign(newLocationURL.toString());
    };
}

/**
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function reloadNow() {
    return (dispatch: Dispatch<Function>, getState: Function) => {
        dispatch(setFatalError(undefined));

        const { locationURL } = getState()['features/base/connection'];

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        if (navigator.product === 'ReactNative') {
            dispatch(appNavigate(toURLString(locationURL)));
        } else {
            dispatch(reloadWithStoredParams());
        }
    };
}

/**
 * Reloads the page by restoring the original URL.
 *
 * @returns {Function}
 */
export function reloadWithStoredParams() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { locationURL } = getState()['features/base/connection'];
        const windowLocation = window.location;
        const oldSearchString = windowLocation.search;

        windowLocation.replace(locationURL.toString());

        if (window.self !== window.top
                && locationURL.search === oldSearchString) {
            // NOTE: Assuming that only the hash or search part of the URL will
            // be changed!
            // location.reload will not trigger redirect/reload for iframe when
            // only the hash params are changed. That's why we need to call
            // reload in addition to replace.
            windowLocation.reload();
        }
    };
}
