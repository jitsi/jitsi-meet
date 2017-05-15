/**
 * Loads a script from a specific URL. React Native cannot load a JS
 * file/resource/URL via a &lt;script&gt; HTML element, so the implementation
 * fetches the specified src as plain text (e.g. via XMLHttpRequest) and then
 * evaluates the fetched string as JavaScript code (i.e. via the {@link eval}
 * function).
 *
 * @param {string} url - The absolute URL from the which the script is to be
 * (down)loaded.
 * @returns {void}
 */
export function loadScript(url) {
    let fetch;
    const method = 'GET';

    // Prefer the Fetch API. Apart from the fact that we're fetching the
    // specified script as a static resource, the Fetch API provides more
    // detailed errors.
    if (typeof (fetch = window.fetch) === 'function') {
        fetch = fetch(url, { method });
    } else {
        // Otherwise, fall back to the XMLHttpRequest API.
        fetch
            = new Promise(resolve => {
                const xhr = new XMLHttpRequest();

                xhr.responseType = 'text';

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        resolve(xhr);
                    }
                };

                xhr.open(method, url, /* async */ true);
                xhr.send();
            });
    }

    return (
        fetch
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
