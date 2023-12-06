// @ts-expect-error
import { API_ID } from '../../../modules/API/constants';
import { getName as getAppName } from '../app/functions';
import { IStore } from '../app/types';
import { getAnalyticsRoomName } from '../base/conference/functions';
import checkChromeExtensionsInstalled from '../base/environment/checkChromeExtensionsInstalled';
import {
    isMobileBrowser
} from '../base/environment/utils';
import JitsiMeetJS, {
    analytics,
    browser
} from '../base/lib-jitsi-meet';
import { isAnalyticsEnabled } from '../base/lib-jitsi-meet/functions.any';
import { getJitsiMeetGlobalNS } from '../base/util/helpers';
import { inIframe } from '../base/util/iframeUtils';
import { loadScript } from '../base/util/loadScript';
import { parseURIString } from '../base/util/uri';
import { isPrejoinPageVisible } from '../prejoin/functions';

import AmplitudeHandler from './handlers/AmplitudeHandler';
import MatomoHandler from './handlers/MatomoHandler';
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
export async function createHandlers({ getState }: IStore) {
    getJitsiMeetGlobalNS().analyticsHandlers = [];

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
        amplitudeIncludeUTM,
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
        amplitudeIncludeUTM,
        blackListedEvents,
        envType: deploymentInfo?.envType || 'dev',
        googleAnalyticsTrackingId,
        matomoEndpoint,
        matomoSiteID,
        group,
        host,
        product: deploymentInfo?.product,
        subproduct: deploymentInfo?.environment,
        user: user?.id,
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
export function initAnalytics(store: IStore, handlers: Array<Object>) {
    const { getState, dispatch } = store;

    if (!isAnalyticsEnabled(getState) || handlers.length === 0) {
        return;
    }

    const state = getState();
    const config = state['features/base/config'];
    const {
        deploymentInfo
    } = config;
    const { group, server } = state['features/base/jwt'];
    const { locationURL = { href: '' } } = state['features/base/connection'];
    const { tenant } = parseURIString(locationURL.href) || {};
    const permanentProperties: {
        appName?: string;
        externalApi?: boolean;
        group?: string;
        inIframe?: boolean;
        isPromotedFromVisitor?: boolean;
        isVisitor?: boolean;
        server?: string;
        tenant?: string;
        wasLobbyVisible?: boolean;
        wasPrejoinDisplayed?: boolean;
        websocket?: boolean;
    } & typeof deploymentInfo = {};

    if (server) {
        permanentProperties.server = server;
    }
    if (group) {
        permanentProperties.group = group;
    }

    // Report the application name
    permanentProperties.appName = getAppName();

    // Report if user is using websocket
    permanentProperties.websocket = typeof config.websocket === 'string';

    // Report if user is using the external API
    permanentProperties.externalApi = typeof API_ID === 'number';

    // Report if we are loaded in iframe
    permanentProperties.inIframe = inIframe();

    // Report the tenant from the URL.
    permanentProperties.tenant = tenant || '/';

    permanentProperties.wasPrejoinDisplayed = isPrejoinPageVisible(state);

    // Currently we don't know if there will be lobby. We will update it to true if we go through lobby.
    permanentProperties.wasLobbyVisible = false;

    // Setting visitor properties to false by default. We will update them later if it turns out we are visitor.
    permanentProperties.isVisitor = false;
    permanentProperties.isPromotedFromVisitor = false;

    // Optionally, include local deployment information based on the
    // contents of window.config.deploymentInfo.
    if (deploymentInfo) {
        for (const key in deploymentInfo) {
            if (deploymentInfo.hasOwnProperty(key)) {
                permanentProperties[key as keyof typeof deploymentInfo] = deploymentInfo[
                    key as keyof typeof deploymentInfo];
            }
        }
    }

    analytics.addPermanentProperties(permanentProperties);
    analytics.setConferenceName(getAnalyticsRoomName(state, dispatch));

    // Set the handlers last, since this triggers emptying of the cache
    analytics.setAnalyticsHandlers(handlers);

    if (!isMobileBrowser() && browser.isChromiumBased()) {
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
 * Tries to load the scripts for the external analytics handlers and creates them.
 *
 * @param {Array} scriptURLs - The array of script urls to load.
 * @param {Object} handlerConstructorOptions - The default options to pass when creating handlers.
 * @private
 * @returns {Promise} Resolves with the handlers that have been successfully loaded and rejects if there are no handlers
 * loaded or the analytics is disabled.
 */
function _loadHandlers(scriptURLs: string[] = [], handlerConstructorOptions: Object) {
    const promises: Promise<{ error?: Error; type: string; url?: string; }>[] = [];

    for (const url of scriptURLs) {
        promises.push(
            loadScript(url).then(
                () => {
                    return { type: 'success' };
                },
                (error: Error) => {
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

        const handlers = [];

        for (const Handler of getJitsiMeetGlobalNS().analyticsHandlers) {
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
