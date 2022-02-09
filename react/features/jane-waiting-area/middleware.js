// @flow

import { createAppStateChangedEvent, sendAnalytics } from '../analytics';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { registerSound, unregisterSound } from '../base/sounds';
import { APP_STATE_CHANGED } from '../mobile/background/actionTypes';

import {
    JANE_WAITING_AREA_START_CONFERENCE
} from './actionTypes';
import {
    setJaneWaitingAreaAudioMuted,
    setJaneWaitingAreaVideoMuted
} from './actions';
import { getAllJaneWaitingAreaConfiguredTracks } from './functions';
import {
    WAITING_AREA_NOTIFICATION_SOUND_FILE,
    WAITING_AREA_NOTIFICATION_SOUND_ID
} from './sound';

declare var APP: Object;

/**
 * The redux middleware for {@link JaneWaitingAreaPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    const { dispatch } = store;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(WAITING_AREA_NOTIFICATION_SOUND_ID, WAITING_AREA_NOTIFICATION_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(WAITING_AREA_NOTIFICATION_SOUND_ID));
        break;

    case JANE_WAITING_AREA_START_CONFERENCE: {
        const { getState } = store;
        const state = getState();
        const { userSelectedSkipJaneWaitingArea } = state['features/jane-waiting-area'];

        userSelectedSkipJaneWaitingArea && dispatch(updateSettings({
            userSelectedSkipJaneWaitingArea
        }));


        const tracks = await getAllJaneWaitingAreaConfiguredTracks(state);

        APP.conference.janeWaitingAreaStart(tracks);

        break;
    }

    case SET_AUDIO_MUTED: {
        store.dispatch(setJaneWaitingAreaAudioMuted(Boolean(action.muted)));
        break;
    }

    case SET_VIDEO_MUTED: {
        store.dispatch(setJaneWaitingAreaVideoMuted(Boolean(action.muted)));
        break;
    }

    case APP_STATE_CHANGED: {
        return _appStateChanged(store, next, action);
    }

    }

    return next(action);
});

/**
 * Send analytics event to datadog based on the app state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_STATE_CHANGED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _appStateChanged(store, next, action) {
    if (navigator.product === 'ReactNative') {
        const { appState } = action;

        sendAnalytics(createAppStateChangedEvent(appState));
    }

    return next(action);
}
