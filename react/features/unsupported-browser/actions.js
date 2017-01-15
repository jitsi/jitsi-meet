import { LANDING_IS_SHOWN } from './actionTypes';
import './reducer';

/**
 * Returns an action that mobile landing is shown
 * and there is no need to show it on other pages.
 *
 * @returns {{
 *     type: LANDING_IS_SHOWN
 * }}
 */
export function landingIsShown() {
    return {
        type: LANDING_IS_SHOWN
    };
}
