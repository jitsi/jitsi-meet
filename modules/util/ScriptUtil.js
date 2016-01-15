/**
 * Implements utility functions which facilitate the dealing with scripts such
 * as the download and execution of a JavaScript file.
 */
var ScriptUtil = {
    /**
     * Loads a script from a specific source.
     *
     * @param src the source from the which the script is to be (down)loaded
     * @param async true to asynchronously load the script or false to
     * synchronously load the script
     * @param prepend true to schedule the loading of the script as soon as
     * possible or false to schedule the loading of the script at the end of the
     * scripts known at the time
     */
    loadScript: function (src, async, prepend) {
        var d = document;
        var tagName = 'script';
        var script = d.createElement(tagName);
        var referenceNode = d.getElementsByTagName(tagName)[0];

        script.async = async;
        script.src = src;
        if (prepend) {
            referenceNode.parentNode.insertBefore(script, referenceNode);
        } else {
            referenceNode.parentNode.appendChild(script);
        }
    },
};

module.exports = ScriptUtil;
