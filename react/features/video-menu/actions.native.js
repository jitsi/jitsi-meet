// @flow
import { hideDialog } from '../base/dialog';

import { RemoteVideoMenu, SharedVideoMenu } from './components/native';

/**
 * Hides the remote video menu.
 *
 * @returns {Function}
 */
export function hideRemoteVideoMenu() {
    return hideDialog(RemoteVideoMenu);
}

/**
 * Hides the shared video menu.
 *
 * @returns {Function}
 */
export function hideSharedVideoMenu() {
    return hideDialog(SharedVideoMenu);
}

export * from './actions.any';
