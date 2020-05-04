// @flow

import { jitsiLocalStorage } from 'js-utils';
import {
    ADD_PREJOIN_AUDIO_TRACK,
    ADD_PREJOIN_VIDEO_TRACK,
    PREJOIN_START_CONFERENCE,
    SET_FUTURE_PAGE_VISIBILITY
} from './actionTypes';
import { setPrejoinAudioMuted, setPrejoinVideoMuted, setUserOptionPageVisibility } from './actions';
import { APP_WILL_MOUNT } from '../base/app';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media';
import { participantUpdated, getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { getAllPrejoinConfiguredTracks, getPrejoinName } from './functions';

declare var APP: Object;
const LOCALSTORAGE_KEY = 'skipPrejoin';

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case ADD_PREJOIN_AUDIO_TRACK: {
        const { value: audioTrack } = action;

        if (audioTrack) {
            store.dispatch(
                    updateSettings({
                        micDeviceId: audioTrack.getDeviceId()
                    }),
            );
        }

        break;
    }

    case ADD_PREJOIN_VIDEO_TRACK: {
        const { value: videoTrack } = action;

        if (videoTrack) {
            store.dispatch(
                    updateSettings({
                        cameraDeviceId: videoTrack.getDeviceId()
                    }),
            );
        }

        break;
    }

    case APP_WILL_MOUNT: {
        const value = !Number(jitsiLocalStorage.getItem(LOCALSTORAGE_KEY));

        store.dispatch(setUserOptionPageVisibility(value));

        break;
    }

    case PREJOIN_START_CONFERENCE: {
        const { dispatch, getState } = store;

        _syncParticipantName(dispatch, getState);
        const tracks = await getAllPrejoinConfiguredTracks(getState());

        APP.conference.prejoinStart(tracks);

        break;
    }

    case SET_AUDIO_MUTED: {
        store.dispatch(setPrejoinAudioMuted(Boolean(action.muted)));
        break;
    }

    case SET_VIDEO_MUTED: {
        store.dispatch(setPrejoinVideoMuted(Boolean(action.muted)));
        break;
    }

    case SET_FUTURE_PAGE_VISIBILITY: {
        jitsiLocalStorage.setItem(LOCALSTORAGE_KEY, Number(action.value));
        break;
    }

    }

    return next(action);
});

/**
 * Sets the local participant name if one is present.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @param {Function} getState - Gets the current state.
 * @returns {undefined}
 */
function _syncParticipantName(dispatch, getState) {
    const state = getState();
    const name = getPrejoinName(state);

    name && dispatch(
            participantUpdated({
                ...getLocalParticipant(state),
                name
            }),
    );
}
