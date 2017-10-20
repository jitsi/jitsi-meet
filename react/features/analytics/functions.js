// @flow

import JitsiMeetJS, {
    analytics,
    isAnalyticsEnabled
} from '../base/lib-jitsi-meet';
import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Sends an analytics event.
 *
 * @inheritdoc
 */
export function sendAnalyticsEvent(...args: Array<any>) {
    analytics.sendEvent(...args);
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

    const config = getState()['features/base/config'];
    const { analyticsScriptUrls } = config;
    const machineId = JitsiMeetJS.getMachineId();
    const handlerConstructorOptions = {
        product: 'lib-jitsi-meet',
        version: JitsiMeetJS.version,
        session: machineId,
        user: `uid-${machineId}`,
        server: getState()['features/base/connection'].locationURL.host
    };

    _loadHandlers(analyticsScriptUrls, handlerConstructorOptions)
        .then(handlers => {
            const state = getState();
            const permanentProperties: Object = {
                roomName: state['features/base/conference'].room,
                userAgent: navigator.userAgent
            };
            const { group, server } = state['features/base/jwt'];

            if (server) {
                permanentProperties.server = server;
            }
            if (group) {
                permanentProperties.group = group;
            }

            // Optionally, include local deployment information based on the
            // contents of window.config.deploymentInfo.
            const { deploymentInfo } = config;

            if (deploymentInfo) {
                for (const key in deploymentInfo) {
                    if (deploymentInfo.hasOwnProperty(key)) {
                        permanentProperties[key] = deploymentInfo[key];
                    }
                }
            }

            analytics.addPermanentProperties(permanentProperties);
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
