/* global $ */
var ConfigUtil = {
    /**
     * Method overrides JSON properties in <tt>config</tt> and
     * <tt>interfaceConfig</tt> Objects with the values from <tt>newConfig</tt>
     * @param config the config object for which we'll be overriding properties
     * @param interfaceConfig the interfaceConfig object for which we'll be
     *                        overriding properties.
     * @param newConfig object containing configuration properties. Destination
     *        object is selected based on root property name:
     *        {
     *          config: {
     *             // config.js properties to be
     *          },
     *          interfaceConfig: {
     *             // interfaceConfig.js properties here
     *          }
     *        }
     */
    overrideConfigJSON: function (config, interfaceConfig, newConfig) {
        for (var configRoot in newConfig) {

            var confObj = null;
            if (configRoot == "config") {
                confObj = config;
            } else if (configRoot == "interfaceConfig") {
                confObj = interfaceConfig;
            } else {
                continue;
            }

            for (var key in newConfig[configRoot]) {
                var value = newConfig[configRoot][key];
                if (confObj[key] && typeof confObj[key] !== typeof value)
                {
                    console.warn(
                        "The type of " + key +
                        " is wrong. That parameter won't be updated in: ",
                        confObj);
                    continue;
                }
                console.info("Overriding " + key + " with: " + value);
                confObj[key] = value;
            }
        }
    }
};

module.exports = ConfigUtil;