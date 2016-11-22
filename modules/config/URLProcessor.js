/* global config, interfaceConfig, getConfigParamsFromUrl */
var configUtils = require('./Util');
var params = {};

params = getConfigParamsFromUrl();

var URLProcessor = {
    setConfigParametersFromUrl: function () {
        // Convert 'params' to JSON object
        // We have:
        // {
        //   "config.disableAudioLevels": false,
        //   "config.channelLastN": -1,
        //   "interfaceConfig.APP_NAME": "Jitsi Meet"
        // }
        // We want to have:
        // {
        //   "config": {
        //     "disableAudioLevels": false,
        //     "channelLastN": -1
        //   },
        //   interfaceConfig: {
        //     APP_NAME: "Jitsi Meet"
        //   }
        // }
        var configJSON = {
            config: {},
            interfaceConfig: {}
        };
        for (var key in params) {
            if (typeof key !== "string") {
                console.warn("Invalid config key: ", key);
                continue;
            }
            var confObj = null, confKey;
            if (key.indexOf("config.") === 0) {
                confObj = configJSON.config;
                confKey = key.substr("config.".length);

                // prevent passing some parameters which can inject scripts
                if (confKey === 'analyticsScriptUrls'
                    || confKey === 'callStatsCustomScriptUrl')
                    continue;

            } else if (key.indexOf("interfaceConfig.") === 0) {
                confObj = configJSON.interfaceConfig;
                confKey = key.substr("interfaceConfig.".length);
            }

            if (!confObj)
                continue;

            confObj[confKey] = params[key];
        }
        configUtils.overrideConfigJSON(config, interfaceConfig, configJSON);
    }
};

module.exports = URLProcessor;
