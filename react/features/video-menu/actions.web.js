// @flow
import { SHOW_CONNECTION_INFO } from '../base/connection/actionTypes';

export * from './actions.any';

/**
 * Sets whether to render the connnection status info into the Popover of the thumbnail or the context menu buttons.
 *
 * @param {boolean} showConnectionInfo - Whether it should show the connection
 * info or the context menu buttons on thumbnail popover.
 * @returns {Object}
 */
export function renderConnectionStatus(showConnectionInfo: boolean) {
    return {
        type: SHOW_CONNECTION_INFO,
        showConnectionInfo
    };
}
