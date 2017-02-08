import { Symbol } from '../base/react';

/**
 * Action to set the AppState API change event listener.
 *
 * {
 *      type: _SET_APP_STATE_LISTENER,
 *      listener: Function
 * }
 *
 * @private
 */
export const _SET_APP_STATE_LISTENER
    = Symbol('_SET_APP_STATE_LISTENER');

/**
 * Action to signal video will be muted because the app is going to the
 * background.
 *
 * {
 *      type: _SET_BACKGROUND_VIDEO_MUTED,
 *      muted: boolean
 * }
 *
 * @private
 */
export const _SET_BACKGROUND_VIDEO_MUTED
    = Symbol('_SET_BACKGROUND_VIDEO_MUTED');

/**
 * Action which signals that the App state has changed (in terms
 * of execution mode).
 *
 * The application state can be one of 'active', 'inactive' or 'background',
 * see: https://facebook.github.io/react-native/docs/appstate.html
 *
 * {
 *      type: APP_STATE_CHANGED,
 *      appState: string
 * }
 *
 * @public
 */
export const APP_STATE_CHANGED = Symbol('APP_STATE_CHANGED');
