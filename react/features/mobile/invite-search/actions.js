// @flow

import {
    LAUNCH_NATIVE_INVITE,
    SEND_INVITE_SUCCESS,
    SEND_INVITE_FAILURE
} from './actionTypes';

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

/**
 * Indicates that all native invites were sent successfully.
 *
 * @param  {string} inviteScope - Scope identifier for the invite success. This
 * is used to look up relevant information on the native side.
 * @returns {void}
 */
export function sendInviteSuccess(inviteScope: string) {
    return {
        type: SEND_INVITE_SUCCESS,
        inviteScope
    };
}

/**
 * Indicates that some native invites failed to send successfully.
 *
 * @param  {Array<*>} items - Invite items that failed to send.
 * @param  {string} inviteScope - Scope identifier for the invite failure. This
 * is used to look up relevant information on the native side.
 * @returns {void}
 */
export function sendInviteFailure(items: Array<*>, inviteScope: string) {
    return {
        type: SEND_INVITE_FAILURE,
        items,
        inviteScope
    };
}
