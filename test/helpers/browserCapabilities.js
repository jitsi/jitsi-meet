import {
    CHROME_PROPERTIES,
    FIREFOX_PROPERTIES,
    MODERATOR_BROWSER
} from './constants';

/**
 * Function that creates browser capabilities.
 *
 * @returns {Object}
 */
export default function createBrowserCapabilities() {

    if (MODERATOR_BROWSER === 'crome') {
        return CHROME_PROPERTIES;
    }

    return FIREFOX_PROPERTIES;
}
