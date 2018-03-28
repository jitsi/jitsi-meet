/**
 * The type of redux action to set InviteSearch's event subscriptions.
 *
 * {
 *     type: _SET_INVITE_SEARCH_SUBSCRIPTIONS,
 *     subscriptions: Array|undefined
 * }
 *
 * @protected
 */
export const _SET_INVITE_SEARCH_SUBSCRIPTIONS
  = Symbol('_SET_INVITE_SEARCH_SUBSCRIPTIONS');


/**
 * The type of the action which signals a request to launch the native invite
 * dialog.
 *
 * {
 *     type: LAUNCH_NATIVE_INVITE
 * }
 */
export const LAUNCH_NATIVE_INVITE = Symbol('LAUNCH_NATIVE_INVITE');

/**
 * The type of the action which signals that native invites were sent
 * successfully.
 *
 * {
 *     type: SEND_INVITE_SUCCESS,
 *     inviteScope: string
 * }
 */
export const SEND_INVITE_SUCCESS = Symbol('SEND_INVITE_SUCCESS');

/**
 * The type of the action which signals that native invites failed to send
 * successfully.
 *
 * {
 *     type: SEND_INVITE_FAILURE,
 *     items: Array<*>,
 *     inviteScope: string
 * }
 */
export const SEND_INVITE_FAILURE = Symbol('SEND_INVITE_FAILURE');
