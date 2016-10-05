import {
    LIB_DISPOSED,
    LIB_INITIALIZED
} from '../lib-jitsi-meet';
import {
    AUDIO_MUTED_CHANGED,
    CAMERA_FACING_MODE_CHANGED,
    MEDIA_TYPE,
    VIDEO_MUTED_CHANGED
} from '../media';
import { MiddlewareRegistry } from '../redux';

import {
    createLocalTracks,
    destroyLocalTracks
} from './actions';
import {
    getLocalTrack,
    setTrackMuted
} from './functions';

/**
 * Middleware that captures LIB_INITIALIZED and LIB_DISPOSED actions
 * and respectively creates/destroys local media tracks. Also listens to media-
 * related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case AUDIO_MUTED_CHANGED:
        _mutedChanged(store, action, MEDIA_TYPE.AUDIO);
        break;

    case CAMERA_FACING_MODE_CHANGED:
        store.dispatch(
            createLocalTracks({
                devices: [ MEDIA_TYPE.VIDEO ],
                facingMode: action.cameraFacingMode
            })
        );
        break;

    case LIB_INITIALIZED:
        store.dispatch(createLocalTracks());
        break;

    case LIB_DISPOSED:
        store.dispatch(destroyLocalTracks());
        break;

    case VIDEO_MUTED_CHANGED:
        _mutedChanged(store, action, MEDIA_TYPE.VIDEO);
        break;
    }

    return next(action);
});

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
function _mutedChanged(store, action, mediaType) {
    const tracks = store.getState()['features/base/tracks'];
    const localTrack = getLocalTrack(tracks, mediaType);

    localTrack && setTrackMuted(localTrack.jitsiTrack, action.muted);
}
