// @flow

/**
 * Opens URL in the browser.
 *
 * @param {string} url - The URL to be opened.
 * @returns {void}
 */
export function openURLInBrowser(url: string) {
    window.open(url, '', 'noopener');
}
