/**
 * The type of redux action used for an event subscription.
 *
 * {
 *     type: EVENT_SUBSCRIPTION,
 *     subscription: NativeEventSubscription
 * }
 *
 * @protected
 */
export const EVENT_SUBSCRIPTION = 'EVENT_SUBSCRIPTION';

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
