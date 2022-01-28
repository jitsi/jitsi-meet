// @flow
import { hideDialog } from '../base/dialog';

import { RemoteVideoMenu, SharedVideoMenu, LocalVideoMenu } from './components/native';

/**
 * Hides the local video menu.
 *
 * @returns {Function}
 */
export function hideLocalVideoMenu() {
    return hideDialog(LocalVideoMenu);
}

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
