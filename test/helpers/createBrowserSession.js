import createChromeSession from './chromeSession';
import { BROWSERS } from './constants';
import createFirefoxSession from './firefoxSession';

/**
 * Function that creates a browser session.
 *
 * @returns {void}
 */
export default function createBrowserSession() {
    for (let i = 0; i < BROWSERS.length; i++) {
        const browserName = BROWSERS[i];
        switch (browserName) {
            case 'chrome':
                return createChromeSession();
            case 'firefox':
                return createFirefoxSession();
            default:
                return
        }
    }
}
