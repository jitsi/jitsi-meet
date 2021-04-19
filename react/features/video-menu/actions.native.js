// @flow
import { hideDialog } from '../base/dialog';

import { RemoteVideoMenu } from './components/native';

/**
 * Hides the remote video menu.
 *
 * @returns {Function}
 */
export function hideRemoteVideoMenu() {
    return hideDialog(RemoteVideoMenu);
}

export * from './actions.any';
