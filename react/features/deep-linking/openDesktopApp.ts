import { IReduxState } from '../app/types';
import { URI_PROTOCOL_PATTERN } from '../base/util/uri';

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
        const regex = new RegExp(URI_PROTOCOL_PATTERN, 'gi');

        window.location.href = window.location.href.replace(regex, `${appScheme}:`);

        return Promise.resolve(true);
    }

    return Promise.resolve(false);
}
