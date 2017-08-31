/* @flow */

import { setConfigFromURLParams } from '../../base/config';
import { loadScript } from '../../base/util';

import JitsiMeetJS from './_';

declare var APP: Object;

const JitsiConnectionErrors = JitsiMeetJS.errors.connection;

/**
 * Creates a JitsiLocalTrack model from the given device id.
 *
 * @param {string} type - The media type of track being created. Expected values
 * are "video" or "audio".
 * @param {string} deviceId - The id of the target media source.
 * @returns {Promise<JitsiLocalTrack>}
 */
export function createLocalTrack(type: string, deviceId: string) {
    return (
        JitsiMeetJS.createLocalTracks({
            cameraDeviceId: deviceId,
            devices: [ type ],

            // eslint-disable-next-line camelcase
            firefox_fake_device:
                window.config && window.config.firefox_fake_device,
            micDeviceId: deviceId
        })
            .then(([ jitsiLocalTrack ]) => jitsiLocalTrack));
}

/**
 * Determines whether a specific JitsiConnectionErrors instance indicates a
 * fatal JitsiConnection error.
 *
 * FIXME Figure out the category of errors defined by the fucntion and describe
 * that category. I've currently named the category fatal because it appears to
 * be used in the cases of unrecoverable errors that necessitate a reload.
 *
 * @param {string} error - The JitsiConnectionErrors instance to
 * categorize/classify.
 * @returns {boolean} True if the specified JitsiConnectionErrors instance
 * indicates a fatal JitsiConnection error; otherwise, false.
 */
export function isFatalJitsiConnectionError(error: string) {
    return (
        error === JitsiConnectionErrors.CONNECTION_DROPPED_ERROR
            || error === JitsiConnectionErrors.OTHER_ERROR
            || error === JitsiConnectionErrors.SERVER_ERROR);
}

/**
 * Loads config.js from a specific remote server.
 *
 * @param {string} url - The URL to load.
 * @returns {Promise<Object>}
 */
export function loadConfig(url: string) {
    let promise;

    if (typeof APP === 'undefined') {
        promise
            = loadScript(url)
                .then(() => {
                    const { config } = window;

                    // We don't want to pollute the global scope.
                    window.config = undefined;

                    if (typeof config !== 'object') {
                        throw new Error('window.config is not an object');
                    }

                    return config;
                })
                .catch(err => {
                    console.error(`Failed to load config from ${url}`, err);

                    throw err;
                });
    } else {
        // Return "the config.js file" from the global scope - that is how the
        // Web app on both the client and the server was implemented before the
        // React Native app was even conceived.
        promise = Promise.resolve(window.config);
    }

    // FIXME It's neither here nor there at the time of this writing where
    // config, interfaceConfig, and loggingConfig should be overwritten by URL
    // params.
    promise = promise.then(value => {
        setConfigFromURLParams();

        return value;
    });

    return promise;
}

/**
 * Evaluates whether analytics is enabled or not based on
 * the redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @returns {boolean} True if analytics is enabled, false otherwise.
 */
export function isAnalyticsEnabled({ getState }: { getState: Function }) {
    const {
        analyticsScriptUrls,
        disableThirdPartyRequests
    } = getState()['features/base/config'];

    const scriptURLs = Array.isArray(analyticsScriptUrls)
        ? analyticsScriptUrls : [];

    return Boolean(scriptURLs.length) && !disableThirdPartyRequests;
}
