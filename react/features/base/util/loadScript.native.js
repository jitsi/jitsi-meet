// @flow

import { timeoutPromise } from './timeoutPromise';

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
 * @returns {void}
 */
export function loadScript(url: string, timeout: ?number): Promise<void> {
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

        let fetch_ = fetch(url, { method: 'GET' });

        // The implementation of fetch provided by react-native is based on
        // XMLHttpRequest. Which defines timeout as an unsigned long with
        // default value 0, which means there is no timeout.
        if (timeout) {
            // FIXME I don't like the approach with timeoutPromise because:
            //
            // * It merely abandons the underlying XHR and, consequently, opens
            //   us to potential issues with NetworkActivityIndicator which
            //   tracks XHRs.
            //
            // * @paweldomas also reported that timeouts seem to be respected by
            //   the XHR implementation on iOS. Given that we have
            //   implementation of loadScript based on fetch and XHR (in an
            //   earlier revision), I don't see why we're not using an XHR
            //   directly on iOS.
            //
            // * The approach of timeoutPromise I found on the Internet is to
            //   directly use XHR instead of fetch and abort the XHR on timeout.
            //   Which may deal with the NetworkActivityIndicator at least.
            fetch_ = timeoutPromise(fetch_, timeout);
        }

        fetch_
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
