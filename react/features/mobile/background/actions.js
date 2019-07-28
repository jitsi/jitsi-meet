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
        if (muted) {
            // We could have it set to 1 if someone is screen-sharing, so re-set it to 0, just in case.
            dispatch(setLastN(0));
        } else {
            const state = getState();
            const { audioOnly } = state['features/base/conference'];
            const screenShares = state['features/video-layout'].screenShares || [];
            const latestScreenshare = screenShares[screenShares.length - 1];

            if (audioOnly) {
                dispatch(setLastN(latestScreenshare ? 1 : 0));
            } else {
                dispatch(setLastN(undefined));
            }
        }

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
