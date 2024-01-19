// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { safeJsonParse } from '@jitsi/js-utils/json';
import _ from 'lodash';

import { IReduxState } from '../../app/types';
import { parseURLParams } from '../util/parseURLParams';

import { IConfig } from './configType';
import CONFIG_WHITELIST from './configWhitelist';
import {
    DEFAULT_HELP_CENTRE_URL,
    DEFAULT_PRIVACY_URL,
    DEFAULT_TERMS_URL,
    FEATURE_FLAGS,
    _CONFIG_STORE_PREFIX
} from './constants';
import INTERFACE_CONFIG_WHITELIST from './interfaceConfigWhitelist';
import logger from './logger';

// XXX The function getRoomName is split out of
// functions.any.js because it is bundled in both app.bundle and
// do_external_connect, webpack 1 does not support tree shaking, and we don't
// want all functions to be bundled in do_external_connect.
export { default as getRoomName } from './getRoomName';

/**
 * Create a "fake" configuration object for the given base URL. This is used in case the config
 * couldn't be loaded in the welcome page, so at least we have something to try with.
 *
 * @param {string} baseURL - URL of the deployment for which we want the fake config.
 * @returns {Object}
 */
export function createFakeConfig(baseURL: string) {
    const url = new URL(baseURL);

    return {
        hosts: {
            domain: url.hostname,
            muc: `conference.${url.hostname}`
        },
        bosh: `${baseURL}http-bind`,
        p2p: {
            enabled: true
        }
    };
}

/**
 * Selector used to get the meeting region.
 *
 * @param {Object} state - The global state.
 * @returns {string}
 */
export function getMeetingRegion(state: IReduxState) {
    return state['features/base/config']?.deploymentInfo?.region || '';
}

/**
 * Selector used to get the SSRC-rewriting feature flag.
 *
 * @param {Object} state - The global state.
 * @returns {boolean}
 */
export function getSsrcRewritingFeatureFlag(state: IReduxState) {
    return getFeatureFlag(state, FEATURE_FLAGS.SSRC_REWRITING);
}

/**
 * Selector used to get a feature flag.
 *
 * @param {Object} state - The global state.
 * @param {string} featureFlag - The name of the feature flag.
 * @returns {boolean}
 */
export function getFeatureFlag(state: IReduxState, featureFlag: string) {
    const featureFlags = state['features/base/config']?.flags || {};

    return featureFlags[featureFlag as keyof typeof featureFlags];
}

/**
 * Selector used to get the disableRemoveRaisedHandOnFocus.
 *
 * @param {Object} state - The global state.
 * @returns {boolean}
 */
export function getDisableRemoveRaisedHandOnFocus(state: IReduxState) {
    return state['features/base/config']?.disableRemoveRaisedHandOnFocus || false;
}

/**
 * Selector used to get the endpoint used for fetching the recording.
 *
 * @param {Object} state - The global state.
 * @returns {string}
 */
export function getRecordingSharingUrl(state: IReduxState) {
    return state['features/base/config'].recordingSharingUrl;
}

/**
 * Overrides JSON properties in {@code config} and
 * {@code interfaceConfig} Objects with the values from {@code newConfig}.
 * Overrides only the whitelisted keys.
 *
 * @param {Object} config - The config Object in which we'll be overriding
 * properties.
 * @param {Object} interfaceConfig - The interfaceConfig Object in which we'll
 * be overriding properties.
 * @param {Object} json - Object containing configuration properties.
 * Destination object is selected based on root property name:
 * {
 *     config: {
 *         // config.js properties here
 *     },
 *     interfaceConfig: {
 *         // interface_config.js properties here
 *     }
 * }.
 * @returns {void}
 */
export function overrideConfigJSON(config: IConfig, interfaceConfig: any, json: any) {
    for (const configName of Object.keys(json)) {
        let configObj;

        if (configName === 'config') {
            configObj = config;
        } else if (configName === 'interfaceConfig') {
            configObj = interfaceConfig;
        }
        if (configObj) {
            const configJSON
                = getWhitelistedJSON(configName as 'interfaceConfig' | 'config', json[configName]);

            if (!_.isEmpty(configJSON)) {
                logger.info(
                    `Extending ${configName} with: ${
                        JSON.stringify(configJSON)}`);

                // eslint-disable-next-line arrow-body-style
                _.mergeWith(configObj, configJSON, (oldValue, newValue) => {

                    // XXX We don't want to merge the arrays, we want to
                    // overwrite them.
                    return Array.isArray(oldValue) ? newValue : undefined;
                });
            }
        }
    }
}

/* eslint-enable max-params, no-shadow */

/**
 * Apply whitelist filtering for configs with whitelists.
 * Only extracts overridden values for keys we allow to be overridden.
 *
 * @param {string} configName - The config name, one of config or interfaceConfig.
 * @param {Object} configJSON - The object with keys and values to override.
 * @returns {Object} - The result object only with the keys
 * that are whitelisted.
 */
export function getWhitelistedJSON(configName: 'interfaceConfig' | 'config', configJSON: any): Object {
    if (configName === 'interfaceConfig') {
        return _.pick(configJSON, INTERFACE_CONFIG_WHITELIST);
    } else if (configName === 'config') {
        return _.pick(configJSON, CONFIG_WHITELIST);
    }

    return configJSON;
}

/**
 * Selector for determining if the display name is read only.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isNameReadOnly(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].disableProfile
        || state['features/base/config'].readOnlyName);
}

/**
 * Selector for determining if the display name is visible.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isDisplayNameVisible(state: IReduxState): boolean {
    return !state['features/base/config'].hideDisplayName;
}

/**
 * Restores a Jitsi Meet config.js from {@code localStorage} if it was
 * previously downloaded from a specific {@code baseURL} and stored with
 * {@link storeConfig}.
 *
 * @param {string} baseURL - The base URL from which the config.js was
 * previously downloaded and stored with {@code storeConfig}.
 * @returns {?Object} The Jitsi Meet config.js which was previously downloaded
 * from {@code baseURL} and stored with {@code storeConfig} if it was restored;
 * otherwise, {@code undefined}.
 */
export function restoreConfig(baseURL: string) {
    const key = `${_CONFIG_STORE_PREFIX}/${baseURL}`;
    const config = jitsiLocalStorage.getItem(key);

    if (config) {
        try {
            return safeJsonParse(config) || undefined;
        } catch (e) {
            // Somehow incorrect data ended up in the storage. Clean it up.
            jitsiLocalStorage.removeItem(key);
        }
    }

    return undefined;
}

/**
 * Inspects the hash part of the location URI and overrides values specified
 * there in the corresponding config objects given as the arguments. The syntax
 * is: {@code https://server.com/room#config.debug=true
 * &interfaceConfig.showButton=false}.
 *
 * In the hash part each parameter will be parsed to JSON and then the root
 * object will be matched with the corresponding config object given as the
 * argument to this function.
 *
 * @param {Object} config - This is the general config.
 * @param {Object} interfaceConfig - This is the interface config.
 * @param {URI} location - The new location to which the app is navigating to.
 * @returns {void}
 */
export function setConfigFromURLParams(
        config: IConfig, interfaceConfig: any, location: string | URL) {
    const params = parseURLParams(location);
    const json: any = {};

    // At this point we have:
    // params = {
    //     "config.disableAudioLevels": false,
    //     "config.channelLastN": -1,
    //     "interfaceConfig.APP_NAME": "Jitsi Meet"
    // }
    // We want to have:
    // json = {
    //     config: {
    //         "disableAudioLevels": false,
    //         "channelLastN": -1
    //     },
    //     interfaceConfig: {
    //         "APP_NAME": "Jitsi Meet"
    //     }
    // }
    config && (json.config = {});
    interfaceConfig && (json.interfaceConfig = {});

    for (const param of Object.keys(params)) {
        let base = json;
        const names = param.split('.');
        const last = names.pop() ?? '';

        for (const name of names) {
            base = base[name] = base[name] || {};
        }

        base[last] = params[param];
    }

    overrideConfigJSON(config, interfaceConfig, json);
}

/* eslint-enable max-params */

/**
 * Returns the dial out url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatusUrl(state: IReduxState) {
    return state['features/base/config'].guestDialOutStatusUrl;
}

/**
 * Returns the dial out status url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutUrl(state: IReduxState) {
    return state['features/base/config'].guestDialOutUrl;
}

/**
 * Selector to return the security UI config.
 *
 * @param {IReduxState} state - State object.
 * @returns {Object}
 */
export function getSecurityUiConfig(state: IReduxState) {
    return state['features/base/config']?.securityUi || {};
}

/**
 * Returns the terms, privacy and help centre URL's.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {{
 *  privacy: string,
 *  helpCentre: string,
 *  terms: string
 * }}
 */
export function getLegalUrls(state: IReduxState) {
    const helpCentreURL = state['features/base/config']?.helpCentreURL;
    const configLegalUrls = state['features/base/config']?.legalUrls;

    return {
        privacy: configLegalUrls?.privacy || DEFAULT_PRIVACY_URL,
        helpCentre: helpCentreURL || configLegalUrls?.helpCentre || DEFAULT_HELP_CENTRE_URL,
        terms: configLegalUrls?.terms || DEFAULT_TERMS_URL
    };
}
