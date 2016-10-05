/**
 * Loads a script from a specific source. This is an extended version of
 * loadScript method from ScriptUtil in lib-jitsi-meet.
 *
 * @param {string} src - The source from the which the script is to be
 * (down)loaded. Can be absolute or relative URL.
 * @param {Object} options - Additional options.
 * @param {boolean} options.async=true - True to asynchronously load the script
 * or false to synchronously load the script.
 * @param {boolean} options.prepend=false - True to schedule the loading of the
 * script as soon as possible or false to schedule the loading of the script at
 * the end of the scripts known at the time.
 * @returns {void}
 */
export function loadScript(
    src,
    options = {
        async: true,
        prepend: false
    }) {
    return new Promise((resolve, reject) => {
        const d = document;
        const tagName = 'script';
        const script = d.createElement(tagName);
        const referenceNode = d.getElementsByTagName(tagName)[0];

        let scriptSource = src;

        if (isRelativeURL(src)) {
            // Find the src URL of the current loaded script and use it as the
            // base of the specified src (argument).
            const scriptEl = document.currentScript;

            if (scriptEl) {
                const scriptSrc = scriptEl.src;
                const baseScriptSrc
                    = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

                if (scriptSrc && baseScriptSrc) {
                    scriptSource = new URL(src, baseScriptSrc).toString();
                }
            }
        }

        script.async = Boolean(options.async);
        script.onerror = reject;
        script.onload = resolve;
        script.src = scriptSource;

        if (referenceNode) {
            if (options.prepend) {
                referenceNode.parentNode.insertBefore(script, referenceNode);
            } else {
                referenceNode.parentNode.appendChild(script);
            }
        } else {
            const head = d.getElementsByTagName('head')[0];

            head.appendChild(script);
        }
    });
}

/**
 * Determines if passed URL is relative or not.
 *
 * @param {string} url - URL.
 * @returns {boolean}
 */
function isRelativeURL(url) {
    let relative;

    // XXX If the specified value is an absolute URL, then an URL object will be
    // correctly initialized from it. Otherwise, an exception will be thrown and
    // we will treat the specified value as a relative URL.
    try {
        new URL(url); // eslint-disable-line no-new
        relative = false;
    } catch (ex) {
        relative = true;
    }

    return relative;
}
