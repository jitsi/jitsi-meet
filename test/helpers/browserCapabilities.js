import {
    CHROME_BROWSER,
    CHROME_PROPERTIES,
    FIREFOX_PROPERTIES,
    PARTICIPANT1_BROWSER
} from './constants';

/**
 * Function that creates browser capabilities.
 *
 * @returns {Object}
 */
export default function createBrowserCapabilities() {

    if (PARTICIPANT1_BROWSER === CHROME_BROWSER) {
        return CHROME_PROPERTIES;
    }

    return FIREFOX_PROPERTIES;
}
