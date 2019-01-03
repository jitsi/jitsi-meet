// @flow

import JitsiMeetJS, {
    analytics,
    isAnalyticsEnabled
} from '../base/lib-jitsi-meet';
import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
 * Loads the analytics scripts and inits JitsiMeetJS.analytics by setting
 * permanent properties and setting the handlers from the loaded scripts.
 * NOTE: Has to be used after JitsiMeetJS.init. Otherwise analytics will be
 * null.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @returns {void}
 */
export function initAnalytics({ getState }: { getState: Function }) {
    getJitsiMeetGlobalNS().analyticsHandlers = [];
    window.analyticsHandlers = []; // Legacy support.

    if (!analytics || !isAnalyticsEnabled(getState)) {
        return;
    }

    const state = getState();
    const config = state['features/base/config'];
    const {
        amplitudeAPPKey,
        analyticsScriptUrls,
        deploymentInfo,
        googleAnalyticsTrackingId
    } = config;
    const { group, server, user } = state['features/base/jwt'];
    const handlerConstructorOptions = {
        amplitudeAPPKey,
        envType: (deploymentInfo && deploymentInfo.envType) || 'dev',
        googleAnalyticsTrackingId,
        group,
        product: deploymentInfo && deploymentInfo.product,
        subproduct: deploymentInfo && deploymentInfo.environment,
        user: user && user.id,
        version: JitsiMeetJS.version
    };

    _loadHandlers(analyticsScriptUrls, handlerConstructorOptions)
        .then(handlers => {
            const roomName = state['features/base/conference'].room;
            const permanentProperties = {};

            if (server) {
                permanentProperties.server = server;
            }
            if (group) {
                permanentProperties.group = group;
            }

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
        },
        error => analytics.dispose() && logger.error(error));
}

/**
 * Tries to load the scripts for the analytics handlers.
 *
 * @param {Array} scriptURLs - The array of script urls to load.
 * @param {Object} handlerConstructorOptions - The default options to pass when
 * creating handlers.
 * @private
 * @returns {Promise} Resolves with the handlers that have been
 * successfully loaded and rejects if there are no handlers loaded or the
 * analytics is disabled.
 */
function _loadHandlers(scriptURLs, handlerConstructorOptions) {
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

        if (analyticsHandlers.length === 0) {
            throw new Error('No analytics handlers available');
        }

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

        logger.debug(`Loaded ${handlers.length} analytics handlers`);

        return handlers;
    });
}
