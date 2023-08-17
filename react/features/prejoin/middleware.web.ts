import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { CONNECTION_FAILED } from '../base/connection/actionTypes';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { updateSettings } from '../base/settings/actions';
import {
    TRACK_ADDED,
    TRACK_NO_DATA_FROM_SOURCE
} from '../base/tracks/actionTypes';

import {
    setDeviceStatusOk,
    setDeviceStatusWarning,
    setJoiningInProgress
} from './actions';
import { isPrejoinPageVisible } from './functions';

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case SET_AUDIO_MUTED: {
        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(updateSettings({
                startWithAudioMuted: Boolean(action.muted)
            }));
        }
        break;
    }

    case SET_VIDEO_MUTED: {
        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(updateSettings({
                startWithVideoMuted: Boolean(action.muted)
            }));
        }
        break;
    }

    case TRACK_ADDED:
    case TRACK_NO_DATA_FROM_SOURCE: {
        const state = store.getState();

        if (isPrejoinPageVisible(state)) {
            const { track: { jitsiTrack: track } } = action;
            const { deviceStatusType, deviceStatusText } = state['features/prejoin'];

            if (!track.isAudioTrack()) {
                break;
            }

            if (track.isReceivingData()) {
                if (deviceStatusType === 'warning'
                    && deviceStatusText === 'prejoin.audioDeviceProblem') {
                    store.dispatch(setDeviceStatusOk('prejoin.lookGood'));
                }
            } else if (deviceStatusType === 'ok') {
                store.dispatch(setDeviceStatusWarning('prejoin.audioDeviceProblem'));
            }
        }
        break;
    }
    case CONFERENCE_FAILED:
    case CONNECTION_FAILED:
        store.dispatch(setJoiningInProgress(false));
        break;
    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);
    }

    return next(action);
});

/**
 * Handles cleanup of prejoin state when a conference is joined.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceJoined({ dispatch }: IStore, next: Function, action: AnyAction) {
    dispatch(setJoiningInProgress(false));

    return next(action);
}
