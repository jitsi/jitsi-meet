interface ILoadScriptOptions {
    async: boolean;
    errorCallback?: () => void;
    loadCallback?: () => void;
    prepend: boolean;
    relativeURL: boolean;
    src: string;
}

/**
 * Loads a script from a specific URL. The script will be interpreted upon load.
 *
 * @param {string} url - The url to be loaded.
 * @returns {Promise} Resolved with no arguments when the script is loaded and
 * rejected with the error from JitsiMeetJS.ScriptUtil.loadScript method.
 */
export function loadScript(url: string): Promise<void> {
    const options: ILoadScriptOptions = {
        async: true,
        prepend: false,
        relativeURL: false,
        src: url
    };

    return new Promise((resolve, reject) =>
        JitsiMeetJS.util.ScriptUtil.loadScript(
            {
                ...options,
                loadCallback: resolve,
                errorCallback: reject
            }
        )
    );
}
