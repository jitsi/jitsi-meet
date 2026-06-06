import logger from './logger';

/**
 * Opens URL in the browser.
 *
 * @param {string} url - The URL to be opened.
 * @param {boolean} openInNewTab - If the link should be opened in a new tab.
 * @returns {void}
 */
export function openURLInBrowser(url: string, openInNewTab?: boolean) {
    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        logger.warn(`Blocked invalid URL: ${url}`);

        return;
    }

    if (![ 'http:', 'https:' ].includes(parsed.protocol)) {
        logger.warn(`Blocked URL with disallowed protocol: ${parsed.protocol}`);

        return;
    }

    const target = openInNewTab ? '_blank' : '';

    window.open(url, target, 'noopener');
}
