/**
 * Checks whether we are loaded in iframe.
 *
 * @returns {boolean} Whether the current page is loaded in an iframe.
 */
export function inIframe(): boolean {
    if (navigator.product === 'ReactNative') {
        return false;
    }

    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}
