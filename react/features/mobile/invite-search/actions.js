// @flow

import { LAUNCH_NATIVE_INVITE } from './actionTypes';

/**
 * Launches the native invite dialog.
 *
 * @returns {{
 *     type: LAUNCH_NATIVE_INVITE
 * }}
 */
export function launchNativeInvite() {
    return {
        type: LAUNCH_NATIVE_INVITE
    };
}
