/**
 * The type of redux action used for app state subscription.
 *
 * {
 *     type: _SET_APP_STATE_SUBSCRIPTION,
 *     subscription: NativeEventSubscription
 * }
 *
 * @protected
 */
export const _SET_APP_STATE_SUBSCRIPTION = '_SET_APP_STATE_SUBSCRIPTION';

/**
 * The type of redux action which signals that the app state has changed (in
 * terms of execution mode). The app state can be one of 'active', 'inactive',
 * or 'background'.
 *
 * {
 *     type: APP_STATE_CHANGED,
 *     appState: string
 * }
 *
 * @public
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
export const APP_STATE_CHANGED = 'APP_STATE_CHANGED';
