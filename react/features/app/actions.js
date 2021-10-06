// @flow

import type { Dispatch } from 'redux';

import { API_ID } from '../../../modules/API/constants';
import { setRoom } from '../base/conference';
import {
    configWillLoad,
    createFakeConfig,
    loadConfigError,
    restoreConfig,
    setConfig,
    storeConfig
} from '../base/config';
import { connect, disconnect, setLocationURL } from '../base/connection';
import { loadConfig } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import { toState } from '../base/redux';
import { createDesiredLocalTracks, isLocalCameraTrackMuted, isLocalTrackMuted } from '../base/tracks';
import {
    addHashParamsToURL,
    getBackendSafeRoomName,
    getLocationContextRoot,
    parseURIString,
    toURLString
} from '../base/util';
import { isVpaasMeeting } from '../jaas/functions';
import { clearNotifications, showNotification } from '../notifications';
import { setFatalError } from '../overlay';

import {
    getDefaultURL,
    getName
} from './functions';
import logger from './logger';

declare var APP: Object;
declare var interfaceConfig: Object;


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
    return async (dispatch: Dispatch<any>, getState: Function) => {
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

        // Disconnect from any current conference.
        // FIXME: unify with web.
        if (navigator.product === 'ReactNative') {
            dispatch(disconnect());
        }

        // There are notifications now that gets displayed after we technically left
        // the conference, but we're still on the conference screen.
        dispatch(clearNotifications());

        dispatch(configWillLoad(locationURL, room));

        let protocol = location.protocol.toLowerCase();

        // The React Native app supports an app-specific scheme which is sure to not
        // be supported by fetch.
        protocol !== 'http:' && protocol !== 'https:' && (protocol = 'https:');

        const baseURL = `${protocol}//${host}${contextRoot || '/'}`;
        let url = `${baseURL}config.js`;

        // XXX In order to support multiple shards, tell the room to the deployment.
        room && (url += `?room=${getBackendSafeRoomName(room)}`);

        let config;

        // Avoid (re)loading the config when there is no room.
        if (!room) {
            config = restoreConfig(baseURL);
        }

        if (!config) {
            try {
                config = await loadConfig(url);
                dispatch(storeConfig(baseURL, config));
            } catch (error) {
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

        // FIXME: unify with web, currently the connection and track creation happens in conference.js.
        if (room && navigator.product === 'ReactNative') {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        }
    };
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
 * Assigns a specific pathname to window.location.pathname taking into account
 * the context root of the Web app.
 *
 * @param {string} pathname - The pathname to assign to
 * window.location.pathname. If the specified pathname is relative, the context
 * root of the Web app will be prepended to the specified pathname before
 * assigning it to window.location.pathname.
 * @param {string} hashParam - Optional hash param to assign to
 * window.location.hash.
 * @returns {Function}
 */
export function redirectToStaticPage(pathname: string, hashParam: ?string) {
    return () => {
        const windowLocation = window.location;
        let newPathname = pathname;

        if (!newPathname.startsWith('/')) {
            // A pathname equal to ./ specifies the current directory. It will be
            // fine but pointless to include it because contextRoot is the current
            // directory.
            newPathname.startsWith('./')
                && (newPathname = newPathname.substring(2));
            newPathname = getLocationContextRoot(windowLocation) + newPathname;
        }

        if (hashParam) {
            windowLocation.hash = hashParam;
        }

        windowLocation.pathname = newPathname;
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

        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted state after the reload.
        const newURL = addTrackStateToURL(locationURL, state);

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        if (navigator.product === 'ReactNative') {
            dispatch(appNavigate(toURLString(newURL)));
        } else {
            dispatch(reloadWithStoredParams());
        }
    };
}

/**
 * Adds the current track state to the passed URL.
 *
 * @param {URL} url - The URL that will be modified.
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {URL} - Returns the modified URL.
 */
function addTrackStateToURL(url, stateful) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];
    const isVideoMuted = isLocalCameraTrackMuted(tracks);
    const isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

    return addHashParamsToURL(new URL(url), { // use new URL object in order to not pollute the passed parameter.
        'config.startWithAudioMuted': isAudioMuted,
        'config.startWithVideoMuted': isVideoMuted
    });

}

/**
 * Reloads the page by restoring the original URL.
 *
 * @returns {Function}
 */
export function reloadWithStoredParams() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted states.
        const newURL = addTrackStateToURL(locationURL, state);
        const windowLocation = window.location;
        const oldSearchString = windowLocation.search;

        windowLocation.replace(newURL.toString());

        if (newURL.search === oldSearchString) {
            // NOTE: Assuming that only the hash or search part of the URL will
            // be changed!
            // location.replace will not trigger redirect/reload when
            // only the hash params are changed. That's why we need to call
            // reload in addition to replace.
            windowLocation.reload();
        }
    };
}

/**
 * Check if the welcome page is enabled and redirects to it.
 * If requested show a thank you dialog before that.
 * If we have a close page enabled, redirect to it without
 * showing any other dialog.
 *
 * @param {Object} options - Used to decide which particular close page to show
 * or if close page is disabled, whether we should show the thankyou dialog.
 * @param {boolean} options.showThankYou - Whether we should
 * show thank you dialog.
 * @param {boolean} options.feedbackSubmitted - Whether feedback was submitted.
 * @returns {Function}
 */
export function maybeRedirectToWelcomePage(options: Object = {}) {
    return (dispatch: Dispatch<any>, getState: Function) => {

        const {
            enableClosePage
        } = getState()['features/base/config'];

        // if close page is enabled redirect to it, without further action
        if (enableClosePage) {
            if (isVpaasMeeting(getState())) {
                redirectToStaticPage('/');

                return;
            }

            const { jwt } = getState()['features/base/jwt'];

            let hashParam;

            // save whether current user is guest or not, and pass auth token,
            // before navigating to close page
            window.sessionStorage.setItem('guest', !jwt);
            window.sessionStorage.setItem('jwt', jwt);

            let path = 'close.html';

            if (interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE) {
                if (Number(API_ID) === API_ID) {
                    hashParam = `#jitsi_meet_external_api_id=${API_ID}`;
                }
                path = 'close3.html';
            } else if (!options.feedbackSubmitted) {
                path = 'close2.html';
            }

            dispatch(redirectToStaticPage(`static/${path}`, hashParam));

            return;
        }

        // else: show thankYou dialog only if there is no feedback
        if (options.showThankYou) {
            dispatch(showNotification({
                titleArguments: { appName: getName() },
                titleKey: 'dialog.thankYou'
            }));
        }

        // if Welcome page is enabled redirect to welcome page after 3 sec, if
        // there is a thank you message to be shown, 0.5s otherwise.
        if (getState()['features/base/config'].enableWelcomePage) {
            setTimeout(
                () => {
                    dispatch(redirectWithStoredParams('/'));
                },
                options.showThankYou ? 3000 : 500);
        }
    };
}
