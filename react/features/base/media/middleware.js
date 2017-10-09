/* @flow */

import { sendEvent } from '../../analytics';
import { SET_ROOM, setAudioOnly } from '../conference';
import { parseURLParams } from '../config';
import { MiddlewareRegistry } from '../redux';
import { setTrackMuted, TRACK_ADDED } from '../tracks';

import { setAudioMuted, setCameraFacingMode, setVideoMuted } from './actions';
import { CAMERA_FACING_MODE } from './constants';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
    const { room } = action;

    // Read the config.

    const state = getState();
    let urlParams;
    let audioMuted;
    let videoMuted;

    if (room) {
        // The Jitsi Meet client may override the Jitsi Meet deployment in the
        // (location) URL on the subject of the following:
        // - startAudioOnly
        // - startWithAudioMuted
        // - startWithVideoMuted
        urlParams
            = parseURLParams(state['features/base/connection'].locationURL);

        audioMuted = urlParams['config.startWithAudioMuted'];
        videoMuted = urlParams['config.startWithVideoMuted'];
    }

    // Of course, the Jitsi Meet deployment defines config.js which should be
    // respected if the client did not override it.
    const config = state['features/base/config'];

    typeof audioMuted === 'undefined'
        && (audioMuted = config.startWithAudioMuted);
    typeof videoMuted === 'undefined'
        && (videoMuted = config.startWithVideoMuted);

    audioMuted = Boolean(audioMuted);
    videoMuted = Boolean(videoMuted);

    // Apply the config.

    sendEvent(`startmuted.client.audio.${audioMuted ? 'muted' : 'unmuted'}`);
    sendEvent(`startmuted.client.video.${videoMuted ? 'muted' : 'unmuted'}`);

    logger.log(`Start muted: ${audioMuted ? 'audio, ' : ''}${
        videoMuted ? 'video' : ''}`);

    // Unconditionally express the desires/expectations/intents of the app and
    // the user i.e. the state of base/media. Eventually, practice/reality i.e.
    // the state of base/tracks will or will not agree with the desires.
    dispatch(setAudioMuted(audioMuted));
    dispatch(setCameraFacingMode(CAMERA_FACING_MODE.USER));
    dispatch(setVideoMuted(videoMuted));

    // config.startAudioOnly
    //
    // FIXME Technically, the audio-only feature is owned by base/conference,
    // not base/media so the following should be in base/conference.
    // Practically, I presume it was easier to write the source code here
    // because it looks like config.startWithAudioMuted and
    // config.startWithVideoMuted.
    if (room) {
        let audioOnly = urlParams && urlParams['config.startAudioOnly'];

        typeof audioOnly === 'undefined' && (audioOnly = config.startAudioOnly);
        audioOnly = Boolean(audioOnly);
        sendEvent(`startaudioonly.${audioOnly ? 'enabled' : 'disabled'}`);
        logger.log(`Start audio only set to ${audioOnly.toString()}`);
        dispatch(setAudioOnly(audioOnly));
    }

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
function _syncTrackMutedState({ getState }, track) {
    const state = getState()['features/base/media'];
    const muted = Boolean(state[track.mediaType].muted);

    // XXX If muted state of track when it was added is different from our media
    // muted state, we need to mute track and explicitly modify 'muted' property
    // on track. This is because though TRACK_ADDED action was dispatched it's
    // not yet in redux state and JitsiTrackEvents.TRACK_MUTE_CHANGED may be
    // fired before track gets to state.
    if (track.muted !== muted) {
        sendEvent(
            `synctrackstate.${track.mediaType}.${muted ? 'muted' : 'unmuted'}`);
        logger.log(`Sync ${track.mediaType} track muted state to ${
            muted ? 'muted' : 'unmuted'}`);
        track.muted = muted;
        setTrackMuted(track.jitsiTrack, muted);
    }
}
