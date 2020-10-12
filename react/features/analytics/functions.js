// @flow

import { API_ID } from '../../../modules/API/constants';
import { getName as getAppName } from '../app/functions';
import {
    checkChromeExtensionsInstalled,
    isMobileBrowser
} from '../base/environment/utils';
import JitsiMeetJS, {
    analytics,
    browser,
    isAnalyticsEnabled
} from '../base/lib-jitsi-meet';
import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

import { AmplitudeHandler, MatomoHandler } from './handlers';
import logger from './logger';

/**
 * Sends an event through the lib-jitsi-meet AnalyticsAdapter interface.
 *
 * @param {Object} event - The event to send. It should be formatted as
 * described in AnalyticsAdapter.js in lib-jitsi-meet.
 * @returns {void}
 */
export function sendAnalytics(event: Object) {
    try {
        analytics.sendEvent(event);
    } catch (e) {
        logger.warn(`Error sending analytics event: ${e}`);
    }
}

/**
 * Return saved amplitude identity info such as session id, device id and user id. We assume these do not change for
 * the duration of the conference.
 *
 * @returns {Object}
 */
export function getAmplitudeIdentity() {
    return analytics.amplitudeIdentityProps;
}

/**
 * Resets the analytics adapter to its initial state - removes handlers, cache,
 * disabled state, etc.
 *
 * @returns {void}
 */
export function resetAnalytics() {
    analytics.reset();
}

/**
 * Creates the analytics handlers.
 *
 * @param {Store} store - The redux store in which the specified {@code action} is being dispatched.
 * @returns {Promise} Resolves with the handlers that have been successfully loaded.
 */
export async function createHandlers({ getState }: { getState: Function }) {
    getJitsiMeetGlobalNS().analyticsHandlers = [];
    window.analyticsHandlers = []; // Legacy support.

    if (!isAnalyticsEnabled(getState)) {
        // Avoid all analytics processing if there are no handlers, since no event would be sent.
        analytics.dispose();

        return [];
    }

    const state = getState();
    const config = state['features/base/config'];
    const { locationURL } = state['features/base/connection'];
    const host = locationURL ? locationURL.host : '';
    const {
        analytics: analyticsConfig = {},
        deploymentInfo
    } = config;
    const {
        amplitudeAPPKey,
        blackListedEvents,
        scriptURLs,
        googleAnalyticsTrackingId,
        matomoEndpoint,
        matomoSiteID,
        whiteListedEvents
    } = analyticsConfig;
    const { group, user } = state['features/base/jwt'];
    const handlerConstructorOptions = {
        amplitudeAPPKey,
        blackListedEvents,
        envType: (deploymentInfo && deploymentInfo.envType) || 'dev',
        googleAnalyticsTrackingId,
        matomoEndpoint,
        matomoSiteID,
        group,
        host,
        product: deploymentInfo && deploymentInfo.product,
        subproduct: deploymentInfo && deploymentInfo.environment,
        user: user && user.id,
        version: JitsiMeetJS.version,
        whiteListedEvents
    };
    const handlers = [];

    if (amplitudeAPPKey) {
        try {
            const amplitude = new AmplitudeHandler(handlerConstructorOptions);

            analytics.amplitudeIdentityProps = amplitude.getIdentityProps();

            handlers.push(amplitude);
        } catch (e) {
            logger.error('Failed to initialize Amplitude handler', e);
        }
    }

    if (matomoEndpoint && matomoSiteID) {
        try {
            const matomo = new MatomoHandler(handlerConstructorOptions);

            handlers.push(matomo);
        } catch (e) {
            logger.error('Failed to initialize Matomo handler', e);
        }
    }

    if (Array.isArray(scriptURLs) && scriptURLs.length > 0) {
        let externalHandlers;

        try {
            externalHandlers = await _loadHandlers(scriptURLs, handlerConstructorOptions);
            handlers.push(...externalHandlers);
        } catch (e) {
            logger.error('Failed to initialize external analytics handlers', e);
        }
    }

    // Avoid all analytics processing if there are no handlers, since no event would be sent.
    if (handlers.length === 0) {
        analytics.dispose();
    }

    logger.info(`Initialized ${handlers.length} analytics handlers`);

    return handlers;
}

/**
 * Inits JitsiMeetJS.analytics by setting permanent properties and setting the handlers from the loaded scripts.
 * NOTE: Has to be used after JitsiMeetJS.init. Otherwise analytics will be null.
 *
 * @param {Store} store - The redux store in which the specified {@code action} is being dispatched.
 * @param {Array<Object>} handlers - The analytics handlers.
 * @returns {void}
 */
export function initAnalytics({ getState }: { getState: Function }, handlers: Array<Object>) {
    if (!isAnalyticsEnabled(getState) || handlers.length === 0) {
        return;
    }

    const state = getState();
    const config = state['features/base/config'];
    const {
        deploymentInfo
    } = config;
    const { group, server } = state['features/base/jwt'];
    const roomName = state['features/base/conference'].room;
    const permanentProperties = {};

    if (server) {
        permanentProperties.server = server;
    }
    if (group) {
        permanentProperties.group = group;
    }

    // Report the application name
    permanentProperties.appName = getAppName();

    // Report if user is using websocket
    permanentProperties.websocket = navigator.product !== 'ReactNative' && typeof config.websocket === 'string';

    // Report if user is using the external API
    permanentProperties.externalApi = typeof API_ID === 'number';

    // Report if we are loaded in iframe
    permanentProperties.inIframe = _inIframe();

    // Optionally, include local deployment information based on the
    // contents of window.config.deploymentInfo.
    if (deploymentInfo) {
        for (const key in deploymentInfo) {
            if (deploymentInfo.hasOwnProperty(key)) {
                permanentProperties[key] = deploymentInfo[key];
            }
        }
    }

    analytics.addPermanentProperties(permanentProperties);
    analytics.setConferenceName(roomName);

    // Set the handlers last, since this triggers emptying of the cache
    analytics.setAnalyticsHandlers(handlers);

    if (!isMobileBrowser() && browser.isChrome()) {
        const bannerCfg = state['features/base/config'].chromeExtensionBanner;

        checkChromeExtensionsInstalled(bannerCfg).then(extensionsInstalled => {
            if (extensionsInstalled?.length) {
                analytics.addPermanentProperties({
                    hasChromeExtension: extensionsInstalled.some(ext => ext)
                });
            }
        });
    }
}

/**
 * Checks whether we are loaded in iframe.
 *
 * @returns {boolean} Returns {@code true} if loaded in iframe.
 * @private
 */
function _inIframe() {
    if (navigator.product === 'ReactNative') {
        return false;
    }

    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * Tries to load the scripts for the external analytics handlers and creates them.
 *
 * @param {Array} scriptURLs - The array of script urls to load.
 * @param {Object} handlerConstructorOptions - The default options to pass when creating handlers.
 * @private
 * @returns {Promise} Resolves with the handlers that have been successfully loaded and rejects if there are no handlers
 * loaded or the analytics is disabled.
 */
function _loadHandlers(scriptURLs = [], handlerConstructorOptions) {
    const promises = [];

    for (const url of scriptURLs) {
        promises.push(
            loadScript(url).then(
                () => {
                    return { type: 'success' };
                },
                error => {
                    return {
                        type: 'error',
                        error,
                        url
                    };
                }));
    }

    return Promise.all(promises).then(values => {
        for (const el of values) {
            if (el.type === 'error') {
                logger.warn(`Failed to load ${el.url}: ${el.error}`);
            }
        }

        // analyticsHandlers is the handlers we want to use
        // we search for them in the JitsiMeetGlobalNS, but also
        // check the old location to provide legacy support
        const analyticsHandlers = [
            ...getJitsiMeetGlobalNS().analyticsHandlers,
            ...window.analyticsHandlers
        ];
        const handlers = [];

        for (const Handler of analyticsHandlers) {
            // Catch any error while loading to avoid skipping analytics in case
            // of multiple scripts.
            try {
                handlers.push(new Handler(handlerConstructorOptions));
            } catch (error) {
                logger.warn(`Error creating analytics handler: ${error}`);
            }
        }
        logger.debug(`Loaded ${handlers.length} external analytics handlers`);

        return handlers;
    });
}
