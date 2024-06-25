import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../base/connection/actionTypes';
import { browser } from '../base/lib-jitsi-meet';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../base/media/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { updateSettings } from '../base/settings/actions';
import {
    TRACK_ADDED,
    TRACK_NO_DATA_FROM_SOURCE
} from '../base/tracks/actionTypes';
import { replaceLocalTrack } from '../base/tracks/actions.any';
import { getLocalTracks } from '../base/tracks/functions.any';
import { iAmVisitor } from '../visitors/functions';

import {
    setDeviceStatusOk,
    setDeviceStatusWarning,
    setJoiningInProgress
} from './actions';
import { isPrejoinPageVisible } from './functions.any';
import logger from './logger';

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED: {
        const { dispatch, getState } = store;
        const result = next(action);

        if (isPrejoinPageVisible(getState())) {
            const { initialGUMPromise = Promise.resolve() } = getState()['features/base/media'].common;

            initialGUMPromise.then(() => {
                const state = getState();
                let localTracks = getLocalTracks(state['features/base/tracks']);
                const trackReplacePromises = [];

                // Do not signal audio/video tracks if the user joins muted.
                for (const track of localTracks) {
                    // Always add the audio track on Safari because of a known issue where audio playout doesn't happen
                    // if the user joins audio and video muted.
                    if ((track.muted && !(browser.isWebKitBased() && track.jitsiTrack
                            && track.jitsiTrack.getType() === MEDIA_TYPE.AUDIO)) || iAmVisitor(state)) {
                        trackReplacePromises.push(dispatch(replaceLocalTrack(track.jitsiTrack, null))
                            .catch((error: any) => {
                                logger.error(`Failed to replace local track (${track.jitsiTrack}) with null: ${error}`);
                            }));
                    }
                }

                Promise.allSettled(trackReplacePromises).then(() => {

                    // Re-fetch the local tracks after muted tracks have been removed above.
                    // This is needed, because the tracks are effectively disposed by the replaceLocalTrack and should
                    // not be used anymore.
                    localTracks = getLocalTracks(getState()['features/base/tracks']);

                    const jitsiTracks = localTracks.map((t: any) => t.jitsiTrack);


                    return APP.conference.startConference(jitsiTracks);
                });
            });
        }

        return result;
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
