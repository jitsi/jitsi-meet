/* @flow */

import { SET_ROOM } from '../conference';
import { parseURLParams } from '../config';
import { MiddlewareRegistry } from '../redux';
import { setTrackMuted, TRACK_ADDED } from '../tracks';

import { setAudioMuted, setCameraFacingMode, setVideoMuted } from './actions';
import { CAMERA_FACING_MODE } from './constants';

/**
 * Implements the entry point of the middleware of the feature base/media.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM:
        return _setRoom(store, next, action);

    case TRACK_ADDED: {
        const result = next(action);

        action.track.local && _syncTrackMutedState(store, action.track);

        return result;
    }
    }

    return next(action);
});

/**
 * Notifies the feature base/media that the action {@link SET_ROOM} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action, {@code SET_ROOM}, which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setRoom({ dispatch, getState }, next, action) {
    const state = getState();
    let audioMuted;
    let videoMuted;

    if (action.room) {
        // The Jitsi Meet client may override the Jitsi Meet deployment on the
        // subject of startWithAudioMuted and/or startWithVideoMuted in the
        // (location) URL.
        const urlParams
            = parseURLParams(state['features/base/connection'].locationURL);

        audioMuted = urlParams['config.startWithAudioMuted'];
        videoMuted = urlParams['config.startWithVideoMuted'];
    }

    // Of course, the Jitsi Meet deployment may define startWithAudioMuted
    // and/or startWithVideoMuted through config.js which should be respected if
    // the client did not override it.
    const config = state['features/base/config'];

    typeof audioMuted === 'undefined'
        && (audioMuted = config.startWithAudioMuted);
    typeof videoMuted === 'undefined'
        && (videoMuted = config.startWithVideoMuted);

    // Apply startWithAudioMuted and startWithVideoMuted.
    audioMuted = Boolean(audioMuted);
    videoMuted = Boolean(videoMuted);

    // Unconditionally express the desires/expectations/intents of the app and
    // the user i.e. the state of base/media. Eventually, practice/reality i.e.
    // the state of base/tracks will or will not agree with the desires.
    dispatch(setAudioMuted(audioMuted));
    dispatch(setCameraFacingMode(CAMERA_FACING_MODE.USER));
    dispatch(setVideoMuted(videoMuted));

    return next(action);
}

/**
 * Syncs muted state of local media track with muted state from media state.
 *
 * @param {Store} store - The redux store.
 * @param {Track} track - The local media track.
 * @private
 * @returns {void}
 */
function _syncTrackMutedState({ dispatch, getState }, track) {
    const state = getState()['features/base/media'];
    const muted = Boolean(state[track.mediaType].muted);

    // XXX If muted state of track when it was added is different from our media
    // muted state, we need to mute track and explicitly modify 'muted' property
    // on track. This is because though TRACK_ADDED action was dispatched it's
    // not yet in redux state and JitsiTrackEvents.TRACK_MUTE_CHANGED may be
    // fired before track gets to state.
    if (track.muted !== muted) {
        track.muted = muted;
        dispatch(setTrackMuted(track.jitsiTrack, muted));
    }
}
