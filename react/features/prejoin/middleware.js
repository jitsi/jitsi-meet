// @flow

import { updateConfig } from '../base/config';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import {
    getLocalTracks,
    replaceLocalTrack,
    TRACK_ADDED,
    TRACK_NO_DATA_FROM_SOURCE
} from '../base/tracks';

import { PREJOIN_START_CONFERENCE } from './actionTypes';
import {
    setDeviceStatusOk,
    setDeviceStatusWarning,
    setPrejoinPageVisibility
} from './actions';
import { isPrejoinPageVisible } from './functions';

declare var APP: Object;

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case PREJOIN_START_CONFERENCE: {
        const { getState, dispatch } = store;
        const state = getState();
        const { userSelectedSkipPrejoin } = state['features/prejoin'];
        let localTracks = getLocalTracks(state['features/base/tracks']);
        const { options } = action;

        options && store.dispatch(updateConfig(options));

        userSelectedSkipPrejoin && dispatch(updateSettings({
            userSelectedSkipPrejoin
        }));

        // Do not signal audio/video tracks if the user joins muted.
        for (const track of localTracks) {
            if (track.muted) {
                await dispatch(replaceLocalTrack(track.jitsiTrack, null));
            }
        }

        // Re-fetch the local tracks after muted tracks have been removed above.
        // This is needed, because the tracks are effectively disposed by the replaceLocalTrack and should not be used
        // anymore.
        localTracks = getLocalTracks(getState()['features/base/tracks']);

        const jitsiTracks = localTracks.map(t => t.jitsiTrack);

        dispatch(setPrejoinPageVisibility(false));
        APP.conference.prejoinStart(jitsiTracks);

        break;
    }

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

    }

    return next(action);
});
