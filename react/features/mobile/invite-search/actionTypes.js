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
