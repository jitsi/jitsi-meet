/* global config */

/**
 * Defines some utility methods that are used before the other JS files are
 * loaded.
 */


/**
 * Builds and returns the room name.
 */
function getRoomName () { // eslint-disable-line no-unused-vars
    var path = window.location.pathname;
    var roomName;

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomName = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * This is making assumptions about how the URL->room mapping happens.
         * It assumes that the room name is expressed in the URL in the last
         * part of the (non-empty) URL path, that matches the regular
         * expression pattern used for rewrite rules in NGINX: [a-zA-Z0-9=\?]+
         */
        if (path.length > 1) {
            var regex = /\/([a-zA-Z0-9=\?]+)$/g;
            var match = regex.exec(path);
            if ( match && match.length > 0 ) {
                roomName = match[1].toLowerCase();
            }
        }
    }

    return roomName;
}

/**
 * Parses the parameters from the URL and returns them as a JS object.
 * @param source {string} values - "hash"/"search" if "search" the parameters
 * will parsed from location.search otherwise from location.hash
 * @param dontParse if false or undefined some transformations
 * (for parsing the value as JSON) are going to be executed
 */
// eslint-disable-next-line no-unused-vars
function getConfigParamsFromUrl(source, dontParse) {
    var paramStr = (source === "search")? location.search : location.hash;
    if (!paramStr)
        return {};
    paramStr = paramStr.substr(1);
    var result = {};
    paramStr.split("&").forEach(function (part) {
        var item = part.split("=");
        var value;
        try {
            value = (dontParse)? item[1] : JSON.parse(
                decodeURIComponent(item[1]).replace(/\\&/, "&"));
        } catch (e) {
            console.warn("Failed to parse URL argument", e);
            if(window.onerror)
                window.onerror("Failed to parse URL argument", null, null,
                    null, e);
            return;
        }
        result[item[0]] = value;
    });
    return result;
}
