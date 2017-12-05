// @flow

declare var JitsiMeetJS: Object;

/**
 * Loads a script from a specific URL. The script will be interpreted upon load.
 *
 * @param {string} url - The url to be loaded.
 * @returns {Promise} Resolved with no arguments when the script is loaded and
 * rejected with the error from JitsiMeetJS.ScriptUtil.loadScript method.
 */
export function loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) =>
        JitsiMeetJS.util.ScriptUtil.loadScript(
            url,
            /* async */ true,
            /* prepend */ false,
            /* relativeURL */ false,
            /* loadCallback */ resolve,
            /* errorCallback */ reject));
}
