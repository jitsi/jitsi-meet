// @ts-expect-error
import { API_ID } from '../../../modules/API';
import { setRoom } from '../base/conference/actions';
import {
    configWillLoad,
    loadConfigError,
    setConfig,
    storeConfig
} from '../base/config/actions';
import { createFakeConfig, restoreConfig } from '../base/config/functions.web';
import { setLocationURL } from '../base/connection/actions.web';
import { loadConfig } from '../base/lib-jitsi-meet/functions.web';
import { inIframe } from '../base/util/iframeUtils';
import { parseURLParams } from '../base/util/parseURLParams';
import {
    appendURLParam,
    getBackendSafeRoomName,
    parseURIString
} from '../base/util/uri';
import { isVpaasMeeting } from '../jaas/functions';
import { clearNotifications, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { setFatalError } from '../overlay/actions';
import { isWelcomePageEnabled } from '../welcome/functions';

import {
    redirectToStaticPage,
    redirectWithStoredParams,
    reloadWithStoredParams
} from './actions.any';
import { getDefaultURL, getName } from './functions.web';
import logger from './logger';
import { IStore } from './types';

export * from './actions.any';


/**
 * Triggers an in-app navigation to a specific route. Allows navigation to be
 * abstracted between the mobile/React Native and Web/React applications.
 *
 * @param {string|undefined} uri - The URI to which to navigate. It may be a
 * full URL with an HTTP(S) scheme, a full or partial URI with the app-specific
 * scheme, or a mere room name.
 * @returns {Function}
 */
export function appNavigate(uri?: string) {
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
export function maybeRedirectToWelcomePage(options: { feedbackSubmitted?: boolean; showThankYou?: boolean; } = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {

        const {
            enableClosePage
        } = getState()['features/base/config'];

        // if close page is enabled redirect to it, without further action
        if (enableClosePage) {
            if (isVpaasMeeting(getState())) {
                const isOpenedInIframe = inIframe();

                if (isOpenedInIframe) {
                    // @ts-ignore
                    window.location = 'about:blank';
                } else {
                    dispatch(redirectToStaticPage('/'));
                }

                return;
            }

            const { jwt } = getState()['features/base/jwt'];

            let hashParam;

            // save whether current user is guest or not, and pass auth token,
            // before navigating to close page
            window.sessionStorage.setItem('guest', (!jwt).toString());
            window.sessionStorage.setItem('jwt', jwt ?? '');

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
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }

        // if Welcome page is enabled redirect to welcome page after 3 sec, if
        // there is a thank you message to be shown, 0.5s otherwise.
        if (isWelcomePageEnabled(getState())) {
            setTimeout(
                () => {
                    dispatch(redirectWithStoredParams('/'));
                },
                options.showThankYou ? 3000 : 500);
        }
    };
}

/**
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function reloadNow() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch(setFatalError(undefined));

        const state = getState();
        const { locationURL } = state['features/base/connection'];

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        dispatch(reloadWithStoredParams());
    };
}
