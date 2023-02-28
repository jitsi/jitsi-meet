/* eslint-disable lines-around-comment */
import { setRoom } from '../base/conference/actions';
import {
    configWillLoad,
    loadConfigError,
    setConfig,
    storeConfig
} from '../base/config/actions';
import {
    createFakeConfig,
    restoreConfig
} from '../base/config/functions';
import { connect, disconnect, setLocationURL } from '../base/connection/actions';
import { loadConfig } from '../base/lib-jitsi-meet/functions.native';
import { createDesiredLocalTracks } from '../base/tracks/actions';
import { parseURLParams } from '../base/util/parseURLParams';
import {
    appendURLParam,
    getBackendSafeRoomName,
    parseURIString,
    toURLString
} from '../base/util/uri';
// @ts-ignore
import { isPrejoinPageEnabled } from '../mobile/navigation/functions';
import {
    goBackToRoot,
    navigateRoot
    // @ts-ignore
} from '../mobile/navigation/rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../mobile/navigation/routes';
import { clearNotifications } from '../notifications/actions';

import { addTrackStateToURL, getDefaultURL } from './functions.native';
import logger from './logger';
import { IReloadNowOptions, IStore } from './types';

export * from './actions.any';

/**
 * Triggers an in-app navigation to a specific route. Allows navigation to be
 * abstracted between the mobile/React Native and Web/React applications.
 *
 * @param {string|undefined} uri - The URI to which to navigate. It may be a
 * full URL with an HTTP(S) scheme, a full or partial URI with the app-specific
 * scheme, or a mere room name.
 * @param {Object} [options] - Options.
 * @returns {Function}
 */
export function appNavigate(uri?: string, options: IReloadNowOptions = {}) {
    logger.info(`appNavigate to ${uri}`);

    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        let location = parseURIString(uri);

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
                location = defaultLocation;
            }
        }

        location.protocol || (location.protocol = 'https:');
        const { contextRoot, host, room } = location;
        const locationURL = new URL(location.toString());

        if (room) {
            navigateRoot(screen.connecting);
        }

        dispatch(disconnect());

        dispatch(configWillLoad(locationURL, room));

        let protocol = location.protocol.toLowerCase();

        // The React Native app supports an app-specific scheme which is sure to not
        // be supported by fetch.
        protocol !== 'http:' && protocol !== 'https:' && (protocol = 'https:');

        const baseURL = `${protocol}//${host}${contextRoot || '/'}`;
        let url = `${baseURL}config.js`;

        // XXX In order to support multiple shards, tell the room to the deployment.
        room && (url = appendURLParam(url, 'room', getBackendSafeRoomName(room) ?? ''));

        const { release } = parseURLParams(location, true, 'search');

        release && (url = appendURLParam(url, 'release', release));

        let config;

        // Avoid (re)loading the config when there is no room.
        if (!room) {
            config = restoreConfig(baseURL);
        }

        if (!config) {
            try {
                config = await loadConfig(url);
                dispatch(storeConfig(baseURL, config));
            } catch (error: any) {
                config = restoreConfig(baseURL);

                if (!config) {
                    if (room) {
                        dispatch(loadConfigError(error, locationURL));

                        return;
                    }

                    // If there is no room (we are on the welcome page), don't fail, just create a fake one.
                    logger.warn('Failed to load config but there is no room, applying a fake one');
                    config = createFakeConfig(baseURL);
                }
            }
        }

        if (getState()['features/base/config'].locationURL !== locationURL) {
            dispatch(loadConfigError(new Error('Config no longer needed!'), locationURL));

            return;
        }

        dispatch(setLocationURL(locationURL));
        dispatch(setConfig(config));
        dispatch(setRoom(room));

        if (room) {
            dispatch(createDesiredLocalTracks());
            dispatch(clearNotifications());

            // @ts-ignore
            const { hidePrejoin } = options;

            if (!hidePrejoin && isPrejoinPageEnabled(getState())) {
                navigateRoot(screen.preJoin);
            } else {
                dispatch(connect());
                navigateRoot(screen.conference.root);
            }
        } else {
            goBackToRoot(getState(), dispatch);
        }
    };
}

/**
 * Check if the welcome page is enabled and redirects to it.
 * If requested show a thank you dialog before that.
 * If we have a close page enabled, redirect to it without
 * showing any other dialog.
 *
 * @param {Object} options - Ignored.
 * @returns {Function}
 */
export function maybeRedirectToWelcomePage(options: any) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Dummy.
}

/**
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function reloadNow() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {

        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted state after the reload.
        // @ts-ignore
        const newURL = addTrackStateToURL(locationURL, state);

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        dispatch(appNavigate(toURLString(newURL), {
            hidePrejoin: true
        }));
    };
}
