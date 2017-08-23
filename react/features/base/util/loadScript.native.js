/**
 * Loads a script from a specific URL. React Native cannot load a JS
 * file/resource/URL via a <script> HTML element, so the implementation
 * fetches the specified src as plain text using fetch() and then
 * evaluates the fetched string as JavaScript code (i.e. via the {@link eval}
 * function).
 *
 * @param {string} url - The absolute URL from the which the script is to be
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
