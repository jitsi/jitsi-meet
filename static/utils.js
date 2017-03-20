/* global config */

/**
 * Defines some utility methods that are used before the other JS files are
 * loaded.
 */


/**
 * Builds and returns the room name.
 */
function getRoomName () { // eslint-disable-line no-unused-vars
    var getroomnode = config.getroomnode;
    var path = window.location.pathname;
    var roomName;

    // Determine the room node from the URL.
    if (getroomnode && typeof getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomName = getroomnode.call(config, path);
    } else {
        // Fall back to the default strategy of making assumptions about how the
        // URL maps to the room (name). It currently assumes a deployment in
        // which the last non-directory component of the path (name) is the
        // room.
        roomName
            = path.substring(path.lastIndexOf('/') + 1).toLowerCase()
                || undefined;
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
