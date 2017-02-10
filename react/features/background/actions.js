import { setVideoMuted } from '../base/media';

import {
    _SET_APP_STATE_LISTENER,
    _SET_BACKGROUND_VIDEO_MUTED,
    APP_STATE_CHANGED
} from './actionTypes';

/**
 * Signals that the App state has changed (in terms of execution state). The
 * application can be in 3 states: 'active', 'inactive' and 'background'.
 *
 * @param {string} appState - The new App state.
 * @public
 * @returns {{
 *      type: APP_STATE_CHANGED,
 *      appState: string
 * }}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
export function appStateChanged(appState: string) {
    return {
        type: APP_STATE_CHANGED,
        appState
    };
}

/**
 * Sets the listener to be used with React Native's AppState API.
 *
 * @param {Function} listener - Function to be set as the change event listener.
 * @protected
 * @returns {{
 *     type: _SET_APP_STATE_LISTENER,
 *     listener: Function
 * }}
 */
export function _setAppStateListener(listener: ?Function) {
    return {
        type: _SET_APP_STATE_LISTENER,
        listener
    };
}

/**
 * Signals that the app should mute video because it's now running in the
 * background, or unmute it because it came back from the background. If video
 * was already muted nothing will happen; otherwise, it will be muted. When
 * coming back from the background the previous state will be restored.
 *
 * @param {boolean} muted - True if video should be muted; false, otherwise.
 * @protected
 * @returns {Function}
 */
export function _setBackgroundVideoMuted(muted: boolean) {
    return (dispatch, getState) => {
        if (muted) {
            const mediaState = getState()['features/base/media'];

            if (mediaState.video.muted) {
                // Video is already muted, do nothing.
                return;
            }
        } else {
            const bgState = getState()['features/background'];

            if (!bgState.videoMuted) {
                // We didn't mute video, do nothing.
                return;
            }
        }

        // Remember that video was muted due to the app going to the background
        // vs user's choice.
        dispatch({
            type: _SET_BACKGROUND_VIDEO_MUTED,
            muted
        });
        dispatch(setVideoMuted(muted));
    };
}
