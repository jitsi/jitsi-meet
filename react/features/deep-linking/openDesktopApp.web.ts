import { executeAfterLoad } from '../app/functions.web';
import { IReduxState } from '../app/types';
import { URI_PROTOCOL_PATTERN } from '../base/util/uri';

/**
 * Builds a desktop deep link URL from a given URL and app scheme.
 *
 * @param {string} url - The URL to convert to a desktop deep link.
 * @param {string} appScheme - The app scheme to use (e.g., 'jitsi-meet').
 * @returns {string} The desktop deep link URL.
 */
export function buildDesktopDeepLinkFromUrl(url: string, appScheme: string): string {
    const regex = new RegExp(URI_PROTOCOL_PATTERN, 'gi');

    return url.replace(regex, `${appScheme}:`);
}

/**
 * Opens the desktop app.
 *
 * @param {Object} _state - Object containing current redux state.
 * @returns {Promise<boolean>} - Resolves with true if the attempt to open the desktop app was successful and resolves
 * with false otherwise.
 */
export function _openDesktopApp(_state: Object) {
    const state = _state as IReduxState;
    const deeplinkingDesktop = state['features/base/config'].deeplinking?.desktop;

    if (deeplinkingDesktop?.enabled) {
        const { appScheme } = deeplinkingDesktop;

        // This is needed to workaround https://issues.chromium.org/issues/41398687
        executeAfterLoad(() => {
            window.location.href = buildDesktopDeepLinkFromUrl(window.location.href, appScheme);
        });

        return Promise.resolve(true);
    }

    return Promise.resolve(false);
}
