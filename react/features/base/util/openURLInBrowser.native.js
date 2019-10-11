// @flow

import { Linking } from 'react-native';

import logger from './logger';

/**
 * Opens URL in the browser.
 *
 * @param {string} url - The URL to be opened.
 * @returns {void}
 */
export function openURLInBrowser(url: string) {
    Linking.openURL(url).catch(error => {
        logger.error(`An error occurred while trying to open ${url}`, error);
    });
}
