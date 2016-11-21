const logger = require("jitsi-meet-logger").getLogger(__filename);

var ConfigUtil = {
    /**
     * Method overrides JSON properties in <tt>config</tt> and
     * <tt>interfaceConfig</tt> Objects with the values from <tt>newConfig</tt>
     * @param config the config object for which we'll be overriding properties
     * @param interfaceConfig the interfaceConfig object for which we'll be
     *                        overriding properties.
     * @param loggingConfig the logging config object for which we'll be
     *        overriding properties.
     * @param newConfig object containing configuration properties. Destination
     *        object is selected based on root property name:
     *        {
     *          config: {
     *             // config.js properties to be
     *          },
     *          interfaceConfig: {
     *             // interface_config.js properties here
     *          },
     *          loggingConfig: {
     *             // logging_config.js properties here
     *          }
     *        }
     */
    overrideConfigJSON: function (config,
                                  interfaceConfig, loggingConfig, newConfig) {
        var configRoot, key, value, confObj;
        for (configRoot in newConfig) {
            confObj = null;
            if (configRoot == "config") {
                confObj = config;
            } else if (configRoot == "interfaceConfig") {
                confObj = interfaceConfig;
            } else if (configRoot == "loggingConfig") {
                confObj = loggingConfig;
            } else {
                continue;
            }

            for (key in newConfig[configRoot]) {
                value = newConfig[configRoot][key];
                if (confObj[key] && typeof confObj[key] !== typeof value) {
                    logger.log("Overriding a " + configRoot +
                        " property with a property of different type.");
                }
                logger.info("Overriding " + key + " with: " + value);
                confObj[key] = value;
            }
        }
    }
};

module.exports = ConfigUtil;
