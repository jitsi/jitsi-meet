/**
 * Loads a script from a specific URL. React Native cannot load a JS
 * file/resource/URL via a <script> HTML element, so the implementation
 * fetches the specified <tt>url</tt> as plain text using {@link fetch()} and
 * then evaluates the fetched string as JavaScript code (using {@link eval()}).
 *
 * @param {string} url - The absolute URL from which the script is to be
 * (down)loaded.
 * @returns {void}
 */
export function loadScript(url) {
    return (
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
            }));
}
