/* @flow */

import { CONFERENCE_LEFT } from '../conference';
import { MiddlewareRegistry } from '../redux';
import { setTrackMuted, TRACK_ADDED } from '../tracks';

import {
    setAudioMuted,
    setCameraFacingMode,
    setVideoMuted
} from './actions';
import { CAMERA_FACING_MODE, MEDIA_TYPE } from './constants';

/**
 * Middleware that captures CONFERENCE_LEFT action and restores initial state
 * for media devices. Also captures TRACK_ADDED to sync 'muted' state.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_LEFT:
        _resetInitialMediaState(store);
        break;

    case TRACK_ADDED:
        action.track.local && _syncTrackMutedState(store, action.track);
        break;
    }

    return result;
});

/**
 * Resets initial media state.
 *
 * @param {Store} store - Redux store.
 * @private
 * @returns {void}
 */
function _resetInitialMediaState(store) {
    const { dispatch, getState } = store;
    const state = getState()['features/base/media'];

    state.audio.muted && dispatch(setAudioMuted(false));
    (state.video.facingMode !== CAMERA_FACING_MODE.USER)
        && dispatch(setCameraFacingMode(CAMERA_FACING_MODE.USER));
    state.video.muted && dispatch(setVideoMuted(false));
}

/**
 * Syncs muted state of local media track with muted state from media state.
 *
 * @param {Store} store - Redux store.
 * @param {Track} track - Local media track.
 * @private
 * @returns {void}
 */
function _syncTrackMutedState(store, track) {
    const state = store.getState()['features/base/media'];
    const muted = state[track.mediaType].muted;

    // XXX If muted state of track when it was added is different from our media
    // muted state, we need to mute track and explicitly modify 'muted' property
    // on track. This is because though TRACK_ADDED action was dispatched it's
    // not yet in Redux state and JitsiTrackEvents.TRACK_MUTE_CHANGED may be
    // fired before track gets to state.
    if (track.muted !== muted) {
        track.muted = muted;
        setTrackMuted(track.jitsiTrack, muted)
            .catch(error => {
                console.error(`setTrackMuted(${muted}) failed`, error);
                const setMuted
                    = track.mediaType === MEDIA_TYPE.AUDIO
                        ? setAudioMuted : setVideoMuted;

                // Failed to sync muted state - dispatch rollback action
                store.dispatch(setMuted(!muted));
            });
    }
}
