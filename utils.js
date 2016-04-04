/* global config */

/**
 * Defines some utility methods that are used before the other JS files are
 * loaded.
 */


/**
 * Builds and returns the room name.
 */
function getRoomName () {
    var path = window.location.pathname;
    var roomName;

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomName = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * this is making assumptions about how the URL->room mapping happens.
         * It currently assumes deployment at root, with a rewrite like the
         * following one (for nginx):
         location ~ ^/([a-zA-Z0-9]+)$ {
         rewrite ^/(.*)$ / break;
         }
        */
        if (path.length > 1) {
            roomName = path.substr(1).toLowerCase();
        }
    }

    return roomName;
}

/**
 * Parses the hash parameters from the URL and returns them as a JS object.
 */
function getConfigParamsFromUrl() {
    if (!location.hash)
        return {};
    var hash = location.hash.substr(1);
    var result = {};
    hash.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = JSON.parse(
            decodeURIComponent(item[1]).replace(/\\&/, "&"));
    });
    return result;
}
