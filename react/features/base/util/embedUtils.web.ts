/**
 * Checks whether we are loaded in iframe.
 *
 * @returns {boolean} Whether the current page is loaded in an iframe.
 */
export function isEmbedded(): boolean {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}


/**
 * Checks whether we are loaded in iframe with same parent domain.
 *
 * @returns {boolean} Whether the current page is loaded in an iframe with same parent domain.
 */
export function isEmbeddedFromSameDomain(): boolean {
    try {
        return window.self.location.host === window.parent.location.host;
    } catch (e) {
        return false;
    }
}
