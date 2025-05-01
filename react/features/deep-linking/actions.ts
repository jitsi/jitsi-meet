import { appNavigate } from '../app/actions';
import { IStore } from '../app/types';
import { isMobileBrowser } from '../base/environment/utils';

import { OPEN_DESKTOP_APP, OPEN_WEB_APP } from './actionTypes';

/**
 * Continue to the conference page.
 *
 * @returns {Function}
 */
export function openWebApp() {
    return (dispatch: IStore['dispatch']) => {
        // In order to go to the web app we need to skip the deep linking
        // interceptor. OPEN_WEB_APP action should set launchInWeb to true in
        // the redux store. After this when appNavigate() is called the
        // deep linking interceptor will be skipped (will return undefined).
        dispatch({ type: OPEN_WEB_APP });

        if (isMobileBrowser()) {
            // Use a full navigation with a extra search param to force update
            // the history state. This is a hack to avoid an edge case on mobile
            // browsers when the site is opened through a deep link and then user
            // presses the system back button, unexpectedly exiting the meeting.
            const url = new URL(window.location.href);

            url.searchParams.set('skipDeepLink', 'true');
            window.location.href = url.href;

            return;
        }
        dispatch(appNavigate());
    };
}

/**
 * Opens the desktop app.
 *
 * @returns {{
 *     type: OPEN_DESKTOP_APP
 * }}
 */
export function openDesktopApp() {
    return {
        type: OPEN_DESKTOP_APP
    };
}
