import { MOBILE_BROWSER_PAGE_IS_SHOWN } from './actionTypes';
import './reducer';

/**
 * Returns an action that mobile browser page is shown and there is no need
 * to show it on other pages.
 *
 * @returns {{
 *     type: MOBILE_BROWSER_PAGE_IS_SHOWN
 * }}
 */
export function mobileBrowserPageIsShown() {
    return {
        type: MOBILE_BROWSER_PAGE_IS_SHOWN
    };
}
