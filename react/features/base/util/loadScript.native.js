/**
 * Loads a script from a specific URL. React Native cannot load a JS
 * file/resource/URL via a <script> HTML element, so the implementation
 * fetches the specified {@code url} as plain text using {@link fetch()} and
 * then evaluates the fetched string as JavaScript code (using {@link eval()}).
 *
 * @param {string} url - The absolute URL from which the script is to be
 * (down)loaded.
 * @returns {void}
 */
export function loadScript(url) {
    return new Promise((resolve, reject) => {
        // XXX The implementation of fetch on Android will throw an Exception on
        // the Java side which will break the app if the URL is invalid (which
        // the implementation of fetch on Android calls 'unexpected url'). In
        // order to try to prevent the breakage of the app, try to fail on an
        // invalid URL as soon as possible.
        const { hostname, pathname, protocol } = new URL(url);

        // XXX The standard URL implementation should throw an Error if the
        // specified URL is relative. Unfortunately, the polyfill used on
        // react-native does not.
        if (!hostname || !pathname || !protocol) {
            reject(`unexpected url: ${url}`);

            return;
        }

        fetch(url, { method: 'GET' })
            .then(response => {
                switch (response.status) {
                case 200:
                    return response.responseText || response.text();

                default:
                    throw response.statusText;
                }
            })
            .then(responseText => {
                eval.call(window, responseText); // eslint-disable-line no-eval
            })
            .then(resolve, reject);
    });
}
