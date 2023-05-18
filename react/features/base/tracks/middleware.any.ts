import { batch } from 'react-redux';

import { IStore } from '../../app/types';
import { _RESET_BREAKOUT_ROOMS } from '../../breakout-rooms/actionTypes';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { getCurrentConference } from '../conference/functions';
import { getMultipleVideoSendingSupportFeatureFlag } from '../config/functions.any';
import {
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_SCREENSHARE_MUTED,
    SET_VIDEO_MUTED,
    TOGGLE_CAMERA_FACING_MODE
} from '../media/actionTypes';
import { gumPending, toggleCameraFacingMode } from '../media/actions';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    MediaType,
    SCREENSHARE_MUTISM_AUTHORITY,
    VIDEO_MUTISM_AUTHORITY
} from '../media/constants';
import { IGUMPendingState } from '../media/types';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import {
    TRACK_UPDATED
} from './actionTypes';
import {
    createLocalTracksA,
    destroyLocalTracks,
    trackMuteUnmuteFailed,
    trackRemoved
} from './actions';
import {
    getLocalTrack,
    isUserInteractionRequiredForUnmute,
    setTrackMuted
} from './functions';
import './subscriber';

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_AUDIO_MUTED:
        if (!action.muted
                && isUserInteractionRequiredForUnmute(store.getState())) {
            return;
        }

        _setMuted(store, action, MEDIA_TYPE.AUDIO);
        break;

    case SET_CAMERA_FACING_MODE: {
        // XXX The camera facing mode of a MediaStreamTrack can be specified
        // only at initialization time and then it can only be toggled. So in
        // order to set the camera facing mode, one may destroy the track and
        // then initialize a new instance with the new camera facing mode. But
        // that is inefficient on mobile at least so the following relies on the
        // fact that there are 2 camera facing modes and merely toggles between
        // them to (hopefully) get the camera in the specified state.
        const localTrack = _getLocalTrack(store, MEDIA_TYPE.VIDEO);
        let jitsiTrack;

        if (localTrack
                && (jitsiTrack = localTrack.jitsiTrack)
                && jitsiTrack.getCameraFacingMode()
                    !== action.cameraFacingMode) {
            store.dispatch(toggleCameraFacingMode());
        }
        break;
    }

    case SET_SCREENSHARE_MUTED:
        _setMuted(store, action, MEDIA_TYPE.SCREENSHARE);
        break;

    case SET_VIDEO_MUTED:
        if (!action.muted
                && isUserInteractionRequiredForUnmute(store.getState())) {
            return;
        }

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
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, remove all tracks from the store.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, prevConference) => {
        const { authRequired, error } = getState()['features/base/conference'];

        // conference keep flipping while we are authenticating, skip clearing while we are in that process
        if (prevConference && !conference && !authRequired && !error) {

            // Clear all tracks.
            const remoteTracks = getState()['features/base/tracks'].filter(t => !t.local);

            batch(() => {
                dispatch(destroyLocalTracks());
                for (const track of remoteTracks) {
                    dispatch(trackRemoved(track.jitsiTrack));
                }
                dispatch({ type: _RESET_BREAKOUT_ROOMS });
            });
        }
    });

/**
 * Gets the local track associated with a specific {@code MEDIA_TYPE} in a
 * specific redux store.
 *
 * @param {Store} store - The redux store from which the local track associated
 * with the specified {@code mediaType} is to be retrieved.
 * @param {MEDIA_TYPE} mediaType - The {@code MEDIA_TYPE} of the local track to
 * be retrieved from the specified {@code store}.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @private
 * @returns {Track} The local {@code Track} associated with the specified
 * {@code mediaType} in the specified {@code store}.
 */
function _getLocalTrack(
        { getState }: { getState: IStore['getState']; },
        mediaType: MediaType,
        includePending = false) {
    return (
        getLocalTrack(
            getState()['features/base/tracks'],
            mediaType,
            includePending));
}

/**
 * Mutes or unmutes a local track with a specific media type.
 *
 * @param {Store} store - The redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @param {MEDIA_TYPE} mediaType - The {@link MEDIA_TYPE} of the local track
 * which is being muted or unmuted.
 * @private
 * @returns {void}
 */
async function _setMuted(store: IStore, { ensureTrack, authority, muted }: {
    authority: number; ensureTrack: boolean; muted: boolean; }, mediaType: MediaType) {
    const { dispatch, getState } = store;
    const localTrack = _getLocalTrack(store, mediaType, /* includePending */ true);
    const state = getState();

    if (mediaType === MEDIA_TYPE.SCREENSHARE
        && getMultipleVideoSendingSupportFeatureFlag(state)
        && !muted) {
        return;
    }

    if (localTrack) {
        // The `jitsiTrack` property will have a value only for a localTrack for which `getUserMedia` has already
        // completed. If there's no `jitsiTrack`, then the `muted` state will be applied once the `jitsiTrack` is
        // created.
        const { jitsiTrack } = localTrack;
        const isAudioOnly = (mediaType === MEDIA_TYPE.VIDEO && authority === VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY)
            || (mediaType === MEDIA_TYPE.SCREENSHARE && authority === SCREENSHARE_MUTISM_AUTHORITY.AUDIO_ONLY);

        // Screenshare cannot be unmuted using the video mute button unless it is muted by audioOnly in the legacy
        // screensharing mode.
        if (jitsiTrack && (
            jitsiTrack.videoType !== 'desktop' || isAudioOnly || getMultipleVideoSendingSupportFeatureFlag(state))
        ) {
            setTrackMuted(jitsiTrack, muted, state, dispatch)
                .catch(() => dispatch(trackMuteUnmuteFailed(localTrack, muted)));
        }
    } else if (!muted && ensureTrack && (typeof APP === 'undefined' || isPrejoinPageVisible(state))) {
        typeof APP !== 'undefined' && dispatch(gumPending([ mediaType ], IGUMPendingState.PENDING_UNMUTE));

        // FIXME: This only runs on mobile now because web has its own way of
        // creating local tracks. Adjust the check once they are unified.
        dispatch(createLocalTracksA({ devices: [ mediaType ] })).then(() => {
            typeof APP !== 'undefined' && dispatch(gumPending([ mediaType ], IGUMPendingState.NONE));
        });
    }
}
