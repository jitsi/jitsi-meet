// @flow

import type { Dispatch } from 'redux';

import {
    createTrackMutedEvent,
    sendAnalytics
} from '../../analytics';
import { setLastN } from '../../base/conference';
import { setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../../base/media';

import { _SET_APP_STATE_LISTENER, APP_STATE_CHANGED } from './actionTypes';

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
    return (dispatch: Dispatch<any>, getState: Function) => {
        // Disable remote video when we mute by setting lastN to 0. Skip it if
        // the conference is in audio-only mode, as it's already configured to
        // have no video. Leave it as undefined when unmuting, the default value
        // for last N will be chosen automatically.
        const { audioOnly } = getState()['features/base/conference'];

        audioOnly || dispatch(setLastN(muted ? 0 : undefined));

        sendAnalytics(createTrackMutedEvent(
            'video',
            'callkit.background.video'));

        dispatch(setVideoMuted(muted, VIDEO_MUTISM_AUTHORITY.BACKGROUND));
    };
}

/**
 * Signals that the App state has changed (in terms of execution state). The
 * application can be in 3 states: 'active', 'inactive' and 'background'.
 *
 * @param {string} appState - The new App state.
 * @public
 * @returns {{
 *     type: APP_STATE_CHANGED,
 *     appState: string
 * }}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
export function appStateChanged(appState: string) {
    return {
        type: APP_STATE_CHANGED,
        appState
    };
}
