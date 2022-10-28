import { Linking } from 'react-native';

import logger from './logger';

/**
 * Opens URL in the browser.
 *
 * @param {string} url - The URL to be opened.
 * @param {boolean} _ignore - Ignored.
 * @returns {void}
 */
export function openURLInBrowser(url: string, _ignore?: boolean) {
    Linking.openURL(url).catch(error => {
        logger.error(`An error occurred while trying to open ${url}`, error);
    });
}
