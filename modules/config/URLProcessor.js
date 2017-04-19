/* global config, interfaceConfig, loggingConfig */

import { parseURLParams } from '../../react/features/base/config';

import configUtils from './Util';

const logger = require("jitsi-meet-logger").getLogger(__filename);

/**
 *  URL params with this prefix should be merged to config.
 */
const CONFIG_PREFIX = 'config.';

/**
 *  URL params with this prefix should be merged to interface config.
 */
const INTERFACE_CONFIG_PREFIX = 'interfaceConfig.';

/**
 * Config keys to be ignored.
 *
 * @type Set
 */
const KEYS_TO_IGNORE = new Set([
    'analyticsScriptUrls',
    'callStatsCustomScriptUrl'
]);

/**
 *  URL params with this prefix should be merged to logging config.
 */
const LOGGING_CONFIG_PREFIX = 'loggingConfig.';

/**
 * Convert 'URL_PARAMS' to JSON object
 * We have:
 * {
 *      "config.disableAudioLevels": false,
 *      "config.channelLastN": -1,
 *      "interfaceConfig.APP_NAME": "Jitsi Meet"
 * }
 * We want to have:
 * {
 *      "config": {
 *          "disableAudioLevels": false,
 *          "channelLastN": -1
 *      },
 *      interfaceConfig: {
 *          "APP_NAME": "Jitsi Meet"
 *      }
 * }
 */
export function setConfigParametersFromUrl() {
    // Parsing config params from URL hash.
    const params = parseURLParams(window.location);

    const configJSON = {
        config: {},
        interfaceConfig: {},
        loggingConfig: {}
    };

    for (const key in params) {
        if (typeof key === 'string') {
            let confObj = null;
            let confKey;

            if (key.indexOf(CONFIG_PREFIX) === 0) {
                confObj = configJSON.config;
                confKey = key.substr(CONFIG_PREFIX.length);

            } else if (key.indexOf(INTERFACE_CONFIG_PREFIX) === 0) {
                confObj = configJSON.interfaceConfig;
                confKey
                    = key.substr(INTERFACE_CONFIG_PREFIX.length);
            } else if (key.indexOf(LOGGING_CONFIG_PREFIX) === 0) {
                confObj = configJSON.loggingConfig;
                confKey = key.substr(LOGGING_CONFIG_PREFIX.length);
            }

            // prevent passing some parameters which can inject scripts
            if (confObj && !KEYS_TO_IGNORE.has(confKey)) {
                confObj[confKey] = params[key];
            }
        } else {
            logger.warn('Invalid config key: ', key);
        }
    }

    configUtils.overrideConfigJSON(
        config, interfaceConfig, loggingConfig,
        configJSON);
}
