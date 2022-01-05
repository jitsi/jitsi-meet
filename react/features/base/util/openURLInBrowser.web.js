// @flow

/**
 * Opens URL in the browser.
 *
 * @param {string} url - The URL to be opened.
 * @param {boolean} openInNewTab - If the link should be opened in a new tab.
 * @returns {void}
 */
export function openURLInBrowser(url: string, openInNewTab?: boolean) {
    const target = openInNewTab ? '_blank' : '';

    window.open(url, target, 'noopener');
}
