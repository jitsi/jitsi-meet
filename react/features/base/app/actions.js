// @flow

import type { Dispatch } from 'redux';

import { APP_WILL_MOUNT, APP_WILL_NAVIGATE, APP_WILL_UNMOUNT } from './actionTypes';

declare var APP;

/**
 * Signals that a specific App will mount (in the terms of React).
 *
 * @param {App} app - The App which will mount.
 * @returns {{
 *     type: APP_WILL_MOUNT,
 *     app: App
 * }}
 */
export function appWillMount(app: Object) {
    return (dispatch: Dispatch<any>) => {
        dispatch({
            type: APP_WILL_MOUNT,
            app
        });

        // TODO There was a redux action creator appInit which I did not like
        // because we already had the redux action creator appWillMount and,
        // respectively, the redux action APP_WILL_MOUNT. So I set out to remove
        // appInit and managed to move everything it was doing but the
        // following. Which is not extremely bad because we haven't moved the
        // API module into its own feature yet so we're bound to work on that in
        // the future.
        typeof APP === 'object' && APP.API.init();
    };
}

/**
 * FIXME.
 *
 * @param {URL} locationURL - FIXME.
 * @param {string} room - FIXME.
 * @returns {{
 *     type: APP_WILL_NAVIGATE,
 *     locationURL: URL,
 *     room: ?string
 * }}
 */
export function appWillNavigate(locationURL: URL, room: ?string) {
    return {
        type: APP_WILL_NAVIGATE,
        locationURL,
        room
    };
}

/**
 * Signals that a specific App will unmount (in the terms of React).
 *
 * @param {App} app - The App which will unmount.
 * @returns {{
 *     type: APP_WILL_UNMOUNT,
 *     app: App
 * }}
 */
export function appWillUnmount(app: Object) {
    return {
        type: APP_WILL_UNMOUNT,
        app
    };
}
