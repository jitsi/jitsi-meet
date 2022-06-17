import { hideSheet } from '../base/dialog';

import { RemoteVideoMenu, SharedVideoMenu, LocalVideoMenu } from './components/native';

/**
 * Hides the local video menu.
 *
 * @returns {Function}
 */
export function hideLocalVideoMenu() {
    return hideSheet(LocalVideoMenu);
}

/**
 * Hides the remote video menu.
 *
 * @returns {Function}
 */
export function hideRemoteVideoMenu() {
    return hideSheet(RemoteVideoMenu);
}

/**
 * Hides the shared video menu.
 *
 * @returns {Function}
 */
export function hideSharedVideoMenu() {
    return hideSheet(SharedVideoMenu);
}

export * from './actions.any';
