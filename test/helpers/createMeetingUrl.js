import { v4 as uuidv4 } from 'uuid';

import { BASE_URL, BROWSERS, DEFAULT_CONFIG } from './constants';

/**
 * Function that creates a meeting url.
 *
 * @returns {void}
 */
export default function createMeetingUrl() {
    for (let i = 0; i < BROWSERS.length; i++) {
        const browserName = BROWSERS[i];

        switch (browserName) {
        case 'chrome':
            // eslint-disable-next-line prefer-template
            return `${BASE_URL}/${'WdioChrome-' + uuidv4()}?${DEFAULT_CONFIG}`;
        case 'firefox':
            // eslint-disable-next-line prefer-template
            return `${BASE_URL}/${'WdioFirefox-' + uuidv4()}?${DEFAULT_CONFIG}`;
        default:
            return;
        }
    }
}
