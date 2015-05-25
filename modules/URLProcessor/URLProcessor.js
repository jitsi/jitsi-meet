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
        for(var k in params)
        {
            if(typeof k !== "string" || k.indexOf("config.") === -1)
                continue;

            var v = params[k];
            var confKey = k.substr(7);
            if(config[confKey] && typeof config[confKey] !== typeof v)
            {
                console.warn("The type of " + k +
                    " is wrong. That parameter won't be updated in config.js.");
                continue;
            }

            config[confKey] = v;

        }

    }
};

module.exports = URLProcessor;