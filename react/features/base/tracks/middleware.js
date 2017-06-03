/* @flow */

import { LIB_DID_DISPOSE, LIB_DID_INIT } from '../lib-jitsi-meet';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_MUTED,
    TOGGLE_CAMERA_FACING_MODE,
    setAudioMuted,
    setVideoMuted
} from '../media';
import { MiddlewareRegistry } from '../redux';

import {
    _disposeAndRemoveTracks,
    createLocalTracks,
    destroyLocalTracks
} from './actions';
import { TRACK_UPDATED } from './actionTypes';
import { getLocalTrack, setTrackMuted } from './functions';

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case LIB_DID_DISPOSE:
        store.dispatch(destroyLocalTracks());
        break;

    case LIB_DID_INIT:
        store.dispatch(createLocalTracks());
        break;

    case SET_AUDIO_MUTED:
        _setMuted(store, action, MEDIA_TYPE.AUDIO);
        break;

    case SET_CAMERA_FACING_MODE: {
        // XXX Destroy the local video track before creating a new one or
        // react-native-webrtc may be slow or get stuck when opening a (video)
        // capturer twice.
        const localTrack = _getLocalTrack(store, MEDIA_TYPE.VIDEO);

        if (localTrack) {
            store.dispatch(_disposeAndRemoveTracks([ localTrack.jitsiTrack ]));
        }

        store.dispatch(
            createLocalTracks({
                devices: [ MEDIA_TYPE.VIDEO ],
                facingMode: action.cameraFacingMode
            })
        );
        break;
    }

    case SET_VIDEO_MUTED:
        _setMuted(store, action, MEDIA_TYPE.VIDEO);
        break;

    case TOGGLE_CAMERA_FACING_MODE: {
        const localTrack = _getLocalTrack(store, MEDIA_TYPE.VIDEO);
        let jitsiTrack;

        if (localTrack && (jitsiTrack = localTrack.jitsiTrack)) {
            // XXX MediaStreamTrack._switchCamera is a custom function
            // implemented in react-native-webrtc for video which switches
            // between the cameras via a native WebRTC library implementation
            // without making any changes to the track.
            jitsiTrack._switchCamera();

            // Don't mirror the video of the back/environment-facing camera.
            const mirror
                = jitsiTrack.getCameraFacingMode() === CAMERA_FACING_MODE.USER;

            store.dispatch({
                type: TRACK_UPDATED,
                track: {
                    jitsiTrack,
                    mirror
                }
            });
        }
        break;
    }

    case TRACK_UPDATED:
        return _trackUpdated(store, next, action);
    }

    return next(action);
});

/**
 * Gets the local track associated with a specific <tt>MEDIA_TYPE</tt> in a
 * specific Redux store.
 *
 * @param {Store} store - The Redux store from which the local track associated
 * with the specified <tt>mediaType</tt> is to be retrieved.
 * @param {MEDIA_TYPE} mediaType - The <tt>MEDIA_TYPE</tt> of the local track to
 * be retrieved from the specified <tt>store</tt>.
 * @private
 * @returns {Track} The local <tt>Track</tt> associated with the specified
 * <tt>mediaType</tt> in the specified <tt>store</tt>.
 */
function _getLocalTrack(store, mediaType: MEDIA_TYPE) {
    return getLocalTrack(store.getState()['features/base/tracks'], mediaType);
}

/**
 * Mutes or unmutes a local track with a specific media type.
 *
 * @param {Store} store - The Redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The Redux action dispatched in the specified store.
 * @param {MEDIA_TYPE} mediaType - The {@link MEDIA_TYPE} of the local track
 * which is being muted or unmuted.
 * @private
 * @returns {void}
 */
function _setMuted(store, action, mediaType: MEDIA_TYPE) {
    const localTrack = _getLocalTrack(store, mediaType);

    localTrack && setTrackMuted(localTrack.jitsiTrack, action.muted);
}

/**
 * Intercepts the action <tt>TRACK_UPDATED</tt> in order to synchronize the
 * muted states of the local tracks of features/base/tracks with the muted
 * states of features/base/media.
 *
 * @param {Store} store - The Redux store in which the specified <tt>action</tt>
 * is being dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified <tt>action</tt> to the specified <tt>store</tt>.
 * @param {Action} action - The Redux action <tt>TRACK_UPDATED</tt> which is
 * being dispatched in the specified <tt>store</tt>.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified <tt>action</tt>.
 */
function _trackUpdated(store, next, action) {
    // Determine the muted state of the local track before the update.
    const track = action.track;
    let mediaType;
    let oldMuted;

    if ('muted' in track) {
        // XXX The return value of JitsiTrack.getType() is of type MEDIA_TYPE
        // that happens to be compatible with the type MEDIA_TYPE defined by
        // jitsi-meet.
        mediaType = track.jitsiTrack.getType();

        const localTrack = _getLocalTrack(store, mediaType);

        if (localTrack) {
            oldMuted = localTrack.muted;
        }
    }

    const result = next(action);

    if (typeof oldMuted !== 'undefined') {
        // Determine the muted state of the local track after the update. If the
        // muted states before and after the update differ, then the respective
        // media state should by synchronized.
        const localTrack = _getLocalTrack(store, mediaType);

        if (localTrack) {
            const newMuted = localTrack.muted;

            if (oldMuted !== newMuted) {
                switch (mediaType) {
                case MEDIA_TYPE.AUDIO:
                    store.dispatch(setAudioMuted(newMuted));
                    break;
                case MEDIA_TYPE.VIDEO:
                    store.dispatch(setVideoMuted(newMuted));
                    break;
                }
            }
        }
    }

    return result;
}
