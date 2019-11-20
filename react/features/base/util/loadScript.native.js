// @flow

/**
 * Default timeout for loading scripts.
 */
const DEFAULT_TIMEOUT = 5000;

/**
 * Loads a script from a specific URL. React Native cannot load a JS
 * file/resource/URL via a <script> HTML element, so the implementation
 * fetches the specified {@code url} as plain text using {@link fetch()} and
 * then evaluates the fetched string as JavaScript code (using {@link eval()}).
 *
 * @param {string} url - The absolute URL from which the script is to be
 * (down)loaded.
 * @param {number} [timeout] - The timeout in millisecnods after which the
 * loading of the specified {@code url} is to be aborted/rejected (if not
 * settled yet).
 * @param {boolean} skipEval - Wether we want to skip evaluating the loaded content or not.
 * @returns {void}
 */
export async function loadScript(
        url: string, timeout: number = DEFAULT_TIMEOUT, skipEval: boolean = false): Promise<any> {
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
        throw new Error(`unexpected url: ${url}`);
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const timer = setTimeout(() => {
        controller.abort();
    }, timeout);

    const response = await fetch(url, { signal });

    // If the timeout hits the above will raise AbortError.

    clearTimeout(timer);

    switch (response.status) {
    case 200: {
        const txt = await response.text();

        if (skipEval) {
            return txt;
        }

        return eval.call(window, txt); // eslint-disable-line no-eval
    }
    default:
        throw new Error(`loadScript error: ${response.statusText}`);
    }
}
