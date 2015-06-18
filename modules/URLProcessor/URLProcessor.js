/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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