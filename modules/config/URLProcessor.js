/* global config, interfaceConfig, loggingConfig */

const logger = require("jitsi-meet-logger").getLogger(__filename);

import { getConfigParamsFromUrl } from '../../react/features/base/config';

import configUtils from './Util';

// Parsing config params from URL hash.
const URL_PARAMS = getConfigParamsFromUrl(window.location);

/**
 *  URL params with this prefix should be merged to config.
 */
const CONFIG_PREFIX = 'config.';

/**
 *  URL params with this prefix should be merged to interface config.
 */
const INTERFACE_CONFIG_PREFIX = 'interfaceConfig.';

/**
 *  URL params with this prefix should be merged to logging config.
 */
const LOGGING_CONFIG_PREFIX = 'loggingConfig.';

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
export default {
    setConfigParametersFromUrl() {
        const configJSON = {
            config: {},
            interfaceConfig: {},
            loggingConfig: {}
        };

        for (const key in URL_PARAMS) {
            if (typeof key === 'string') {
                let confObj = null;
                let confKey;

                if (key.indexOf(CONFIG_PREFIX) === 0) {
                    confObj = configJSON.config;
                    confKey = key.substr(CONFIG_PREFIX.length);

                    // prevent passing some parameters which can inject scripts
                    if (confObj && !KEYS_TO_IGNORE.has(confKey)) {
                        confObj[confKey] = URL_PARAMS[key];
                    }

                } else if (key.indexOf(INTERFACE_CONFIG_PREFIX) === 0) {
                    confObj = configJSON.interfaceConfig;
                    confKey
                        = key.substr(INTERFACE_CONFIG_PREFIX.length);
                } else if (key.indexOf(LOGGING_CONFIG_PREFIX) === 0) {
                    confObj = configJSON.loggingConfig;
                    confKey = key.substr(LOGGING_CONFIG_PREFIX.length);
                }

            } else {
                logger.warn('Invalid config key: ', key);
            }
        }

        configUtils.overrideConfigJSON(
            config, interfaceConfig, loggingConfig, configJSON);
    }
};
