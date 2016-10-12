/**
 * Loads a script from a specific source. React Native cannot load a JS
 * file/resource/URL via a &lt;script&gt; HTML element, so the implementation
 * fetches the specified src as plain text (e.g. via XMLHttpRequest) and then
 * evaluates the fetched string as JavaScript code (i.e. via the {@link eval}
 * function).
 *
 * @param {string} src - The source from the which the script is to be
 * (down)loaded. Only absolute URLs are supported.
 * @param {Object} options - Additional options.
 * @param {boolean} options.async=true - True to asynchronously load the script
 * or false to synchronously load the script.
 * @returns {void}
 */
export function loadScript(
    src,
    options = {
        async: true
    }) {
    return new Promise((resolve, reject) => {
        // XXX We are using XMLHttpRequest instead of Fetch API only in order
        // to be able to do 'sync' requests. If this not needed, this can be
        // replaced with much simpler and readable fetch().
        const xhr = new XMLHttpRequest();

        xhr.open('GET', src, options.async);
        xhr.responseType = 'text';

        xhr.onload = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        // eslint-disable-next-line no-eval
                        eval.call(window, xhr.responseText);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(xhr.statusText);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);

        xhr.send();
    });
}
