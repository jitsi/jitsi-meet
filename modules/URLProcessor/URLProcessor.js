/* global $, $iq, config, interfaceConfig */
var params = {};
function getConfigParamsFromUrl() {
    if(!location.hash)
        return {};
    var hash = location.hash.substr(1);
    var result = {};
    hash.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = JSON.parse(
            decodeURIComponent(item[1]).replace(/\\&/, "&"));
    });
    return result;
}

params = getConfigParamsFromUrl();

var URLProcessor = {
    setConfigParametersFromUrl: function () {
        for(var key in params) {
            if(typeof key !== "string")
                continue;

            var confObj = null, confKey;
            if (key.indexOf("config.") === 0) {
                confObj = config;
                confKey = key.substr("config.".length);
            } else if (key.indexOf("interfaceConfig.") === 0) {
                confObj = interfaceConfig;
                confKey = key.substr("interfaceConfig.".length);
            }

            if (!confObj)
                continue;

            var value = params[key];
            if (confObj[confKey] && typeof confObj[confKey] !== typeof value)
            {
                console.warn("The type of " + key +
                    " is wrong. That parameter won't be updated in config.js.");
                continue;
            }

            confObj[confKey] = value;
        }

    }
};

module.exports = URLProcessor;