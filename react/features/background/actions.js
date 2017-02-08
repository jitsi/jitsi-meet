import {
    _SET_APP_STATE_LISTENER,
    _SET_BACKGROUND_VIDEO_MUTED,
    APP_STATE_CHANGED
} from './actionTypes';
import { setVideoMuted } from '../base/media';


/**
 * Signals that the App state has changed (in terms of execution mode). The
 * application can be in 3 states: 'active', 'inactive' and 'background'.
 *
 * @see https://facebook.github.io/react-native/docs/appstate.html
 *
 * @param  {string} appState - The new App state.
 * @returns {{
 *      type: APP_STATE_CHANGED,
 *      appState: string
 * }}
 */
export function appStateChanged(appState: string) {
    return {
        type: APP_STATE_CHANGED,
        appState
    };
}


/**
 * Signals that the app should mute video because it's now running in
 * the background, or unmute it, if it came back from the background.
 *
 * If video was already muted nothing will happen, otherwise it will be
 * muted. When coming back from the background the previous state will
 * be restored.
 *
 * @param  {boolean} muted - Set to true if video should be muted, false
 * otherwise.
 * @returns {Function}
 */
export function setBackgroundVideoMuted(muted: boolean) {
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

        dispatch(_setBackgroundVideoMuted(muted));
        dispatch(setVideoMuted(muted));
    };
}


/**
 * Internal action which sets the listener to be used with React Native's
 * AppState API.
 *
 * @param  {Function} listener - Function to be set as the change event
 * listener.
 * @returns {{
 *      type: _SET_APP_STATE_LISTENER,
 *      listener: Function
 * }}
 */
export function _setAppStateListener(listener: ?Function) {
    return {
        type: _SET_APP_STATE_LISTENER,
        listener
    };
}


/**
 * Internal action which signals that video is going to be muted because the
 * application is going to the background. This action is used to remember if
 * video was muted due to the app going to the background vs user's choice.
 *
 * @param  {type} muted - Set to true if video will be muted, false otherwise.
 * @private
 * @returns {{
 *      type: _SET_BACKGROUND_VIDEO_MUTED,
 *      muted: boolean
 * }}
 */
function _setBackgroundVideoMuted(muted: boolean) {
    return {
        type: _SET_BACKGROUND_VIDEO_MUTED,
        muted
    };
}
