/* global config, interfaceConfig, loggingConfig */

const logger = require("jitsi-meet-logger").getLogger(__filename);

import { getConfigParamsFromUrl } from '../../react/features/base/config';

import configUtils from './Util';

// Parsing config params from URL hash.
const URL_PARAMS = getConfigParamsFromUrl(window.location);

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

        Object.keys(URL_PARAMS).forEach(key => {
            if (typeof key !== 'string') {
                logger.warn('Invalid config key: ', key);

                return;
            }

            let confObj = null;
            let confKey;

            if (key.indexOf('config.') === 0) {
                confObj = configJSON.config;
                confKey = key.substr('config.'.length);

                // prevent passing some parameters which can inject scripts
                if (confKey === 'analyticsScriptUrls'
                    || confKey === 'callStatsCustomScriptUrl') {
                    return;
                }

            } else if (key.indexOf('interfaceConfig.') === 0) {
                confObj = configJSON.interfaceConfig;
                confKey = key.substr('interfaceConfig.'.length);
            } else if (key.indexOf('loggingConfig.') === 0) {
                confObj = configJSON.loggingConfig;
                confKey = key.substr('loggingConfig.'.length);
            }

            if (!confObj) {
                return;
            }

            confObj[confKey] = URL_PARAMS[key];
        });

        configUtils.overrideConfigJSON(
            config, interfaceConfig, loggingConfig, configJSON);
    }
};
