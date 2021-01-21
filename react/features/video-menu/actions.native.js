// @flow
import { hideDialog } from '../base/dialog';

import { RemoteVideoMenu } from './components';

export * from './actions.any';

/**
 * Hides the remote video menu.
 *
 * @returns {Function}
 */
export function hideRemoteVideoMenu() {
    return hideDialog(RemoteVideoMenu);
}
