// @flow

import UIEvents from '../../../../service/UI/UIEvents';
import { hideNotification } from '../../notifications';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_MUTED,
    VIDEO_MUTISM_AUTHORITY,
    TOGGLE_CAMERA_FACING_MODE,
    toggleCameraFacingMode
} from '../media';
import { MiddlewareRegistry } from '../redux';

import {
    TOGGLE_SCREENSHARING,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_REMOVED,
    TRACK_UPDATED
} from './actionTypes';
import {
    createLocalTracksA,
    showNoDataFromSourceVideoError,
    trackNoDataFromSourceNotificationInfoChanged
} from './actions';
import {
    getLocalTrack,
    getTrackByJitsiTrack,
    isUserInteractionRequiredForUnmute,
    setTrackMuted
} from './functions';

declare var APP: Object;

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
    case TRACK_NO_DATA_FROM_SOURCE: {
        const result = next(action);

        _handleNoDataFromSourceErrors(store, action);

        return result;
    }
    case TRACK_REMOVED: {
        _removeNoDataFromSourceNotification(store, action.track);
        break;
    }
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

    case SET_VIDEO_MUTED:
        if (!action.muted
                && isUserInteractionRequiredForUnmute(store.getState())) {
            return;
        }

        _setMuted(store, action, action.mediaType);
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

    case TOGGLE_SCREENSHARING:
        if (typeof APP === 'object') {
            APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
        }
        break;

    case TRACK_UPDATED:
        // TODO Remove the following calls to APP.UI once components interested
        // in track mute changes are moved into React and/or redux.
        if (typeof APP !== 'undefined') {
            const result = next(action);

            const { jitsiTrack } = action.track;
            const muted = jitsiTrack.isMuted();
            const participantID = jitsiTrack.getParticipantId();
            const isVideoTrack = jitsiTrack.type !== MEDIA_TYPE.AUDIO;

            if (isVideoTrack) {
                if (jitsiTrack.type === MEDIA_TYPE.PRESENTER) {
                    APP.conference.mutePresenter(muted);
                }

                // Make sure we change the video mute state only for camera tracks.
                if (jitsiTrack.isLocal() && jitsiTrack.videoType !== 'desktop') {
                    APP.conference.setVideoMuteStatus(muted);
                } else {
                    APP.UI.setVideoMuted(participantID, muted);
                }
                APP.UI.onPeerVideoTypeChanged(participantID, jitsiTrack.videoType);
            } else if (jitsiTrack.isLocal()) {
                APP.conference.setAudioMuteStatus(muted);
            } else {
                APP.UI.setAudioMuted(participantID, muted);
            }

            return result;
        }

    }

    return next(action);
});

/**
 * Handles no data from source errors.
 *
 * @param {Store} store - The redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @private
 * @returns {void}
 */
function _handleNoDataFromSourceErrors(store, action) {
    const { getState, dispatch } = store;

    const track = getTrackByJitsiTrack(getState()['features/base/tracks'], action.track.jitsiTrack);

    if (!track || !track.local) {
        return;
    }

    const { jitsiTrack } = track;

    if (track.mediaType === MEDIA_TYPE.AUDIO && track.isReceivingData) {
        _removeNoDataFromSourceNotification(store, action.track);
    }

    if (track.mediaType === MEDIA_TYPE.VIDEO) {
        const { noDataFromSourceNotificationInfo = {} } = track;

        if (track.isReceivingData) {
            if (noDataFromSourceNotificationInfo.timeout) {
                clearTimeout(noDataFromSourceNotificationInfo.timeout);
                dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, undefined));
            }

            // try to remove the notification if there is one.
            _removeNoDataFromSourceNotification(store, action.track);
        } else {
            if (noDataFromSourceNotificationInfo.timeout) {
                return;
            }

            const timeout = setTimeout(() => dispatch(showNoDataFromSourceVideoError(jitsiTrack)), 5000);

            dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, { timeout }));
        }
    }
}

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
        { getState }: { getState: Function },
        mediaType: MEDIA_TYPE,
        includePending: boolean = false) {
    return (
        getLocalTrack(
            getState()['features/base/tracks'],
            mediaType,
            includePending));
}

/**
 * Removes the no data from source notification associated with the JitsiTrack if displayed.
 *
 * @param {Store} store - The redux store.
 * @param {Track} track - The redux action dispatched in the specified store.
 * @returns {void}
 */
function _removeNoDataFromSourceNotification({ getState, dispatch }, track) {
    const t = getTrackByJitsiTrack(getState()['features/base/tracks'], track.jitsiTrack);
    const { jitsiTrack, noDataFromSourceNotificationInfo = {} } = t || {};

    if (noDataFromSourceNotificationInfo && noDataFromSourceNotificationInfo.uid) {
        dispatch(hideNotification(noDataFromSourceNotificationInfo.uid));
        dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, undefined));
    }
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
function _setMuted(store, { ensureTrack, authority, muted }, mediaType: MEDIA_TYPE) {
    const localTrack
        = _getLocalTrack(store, mediaType, /* includePending */ true);

    if (localTrack) {
        // The `jitsiTrack` property will have a value only for a localTrack for
        // which `getUserMedia` has already completed. If there's no
        // `jitsiTrack`, then the `muted` state will be applied once the
        // `jitsiTrack` is created.
        const { jitsiTrack } = localTrack;
        const isAudioOnly = authority === VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY;

        // screenshare cannot be muted or unmuted using the video mute button
        // anymore, unless it is muted by audioOnly.
        jitsiTrack && (jitsiTrack.videoType !== 'desktop' || isAudioOnly)
            && setTrackMuted(jitsiTrack, muted);
    } else if (!muted && ensureTrack && typeof APP === 'undefined') {
        // FIXME: This only runs on mobile now because web has its own way of
        // creating local tracks. Adjust the check once they are unified.
        store.dispatch(createLocalTracksA({ devices: [ mediaType ] }));
    }
}
