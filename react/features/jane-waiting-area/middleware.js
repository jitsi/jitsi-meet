// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { registerSound, unregisterSound } from '../base/sounds';

import {
    ADD_JANE_WAITING_AREA_AUDIO_TRACK,
    ADD_JANE_WAITING_AREA_VIDEO_TRACK,
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
    case ADD_JANE_WAITING_AREA_AUDIO_TRACK: {
        const { value: audioTrack } = action;

        if (audioTrack) {
            store.dispatch(
                    updateSettings({
                        micDeviceId: audioTrack.getDeviceId()
                    })
            );
        }

        break;
    }

    case ADD_JANE_WAITING_AREA_VIDEO_TRACK: {
        const { value: videoTrack } = action;

        if (videoTrack) {
            store.dispatch(
                    updateSettings({
                        cameraDeviceId: videoTrack.getDeviceId()
                    })
            );
        }

        break;
    }

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

    }

    return next(action);
});
