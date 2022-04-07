// @flow

import { AUDIO_ONLY_SCREEN_SHARE_NO_TRACK } from '../../../../modules/UI/UIErrors';
import { showNotification, NOTIFICATION_TIMEOUT_TYPE } from '../../notifications';
import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin';
import { setScreenAudioShareState, setScreenshareAudioTrack } from '../../screen-share';
import { AudioMixerEffect } from '../../stream-effects/audio-mixer/AudioMixerEffect';
import { setAudioOnly } from '../audio-only';
import { getMultipleVideoSupportFeatureFlag } from '../config/functions.any';
import { JitsiConferenceErrors, JitsiTrackErrors } from '../lib-jitsi-meet';
import { MEDIA_TYPE, setScreenshareMuted, VIDEO_TYPE } from '../media';
import { MiddlewareRegistry } from '../redux';
import {
    addLocalTrack,
    createLocalTracksF,
    getLocalDesktopTrack,
    getLocalJitsiAudioTrack,
    replaceLocalTrack,
    TOGGLE_SCREENSHARING
} from '../tracks';

import { CONFERENCE_FAILED, CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_JOINED } from './actionTypes';
import { getCurrentConference } from './functions';
import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const { enableForcedReload } = getState()['features/base/config'];

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        dispatch(setPrejoinPageVisibility(false));

        break;
    }
    case CONFERENCE_JOINED: {
        if (enableForcedReload) {
            dispatch(setSkipPrejoinOnReload(false));
        }

        break;
    }
    case CONFERENCE_FAILED: {
        enableForcedReload
            && action.error?.name === JitsiConferenceErrors.CONFERENCE_RESTARTED
            && dispatch(setSkipPrejoinOnReload(true));

        break;
    }
    case TOGGLE_SCREENSHARING: {
        getMultipleVideoSupportFeatureFlag(getState()) && _toggleScreenSharing(action, store);

        break;
    }
    }

    return next(action);
});

/**
 * Displays a UI notification for screensharing failure based on the error passed.
 *
 * @private
 * @param {Object} error - The error.
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _handleScreensharingError(error, { dispatch }) {
    if (error.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED) {
        return;
    }
    let descriptionKey, titleKey;

    if (error.name === JitsiTrackErrors.PERMISSION_DENIED) {
        descriptionKey = 'dialog.screenSharingPermissionDeniedError';
        titleKey = 'dialog.screenSharingFailedTitle';
    } else if (error.name === JitsiTrackErrors.CONSTRAINT_FAILED) {
        descriptionKey = 'dialog.cameraConstraintFailedError';
        titleKey = 'deviceError.cameraError';
    } else if (error.name === JitsiTrackErrors.SCREENSHARING_GENERIC_ERROR) {
        descriptionKey = 'dialog.screenSharingFailed';
        titleKey = 'dialog.screenSharingFailedTitle';
    } else if (error === AUDIO_ONLY_SCREEN_SHARE_NO_TRACK) {
        descriptionKey = 'notify.screenShareNoAudio';
        titleKey = 'notify.screenShareNoAudioTitle';
    }

    dispatch(showNotification({
        titleKey,
        descriptionKey
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
}

/**
 * Applies the AudioMixer effect on the local audio track if applicable. If there is no local audio track, the desktop
 * audio track is added to the conference.
 *
 * @private
 * @param {JitsiLocalTrack} desktopAudioTrack - The audio track to be added to the conference.
 * @param {*} state - The redux state.
 * @returns {void}
 */
async function _maybeApplyAudioMixerEffect(desktopAudioTrack, state) {
    const localAudio = getLocalJitsiAudioTrack(state);
    const conference = getCurrentConference(state);

    if (localAudio) {
        // If there is a localAudio stream, mix in the desktop audio stream captured by the screen sharing API.
        const mixerEffect = new AudioMixerEffect(desktopAudioTrack);

        await localAudio.setEffect(mixerEffect);
    } else {
        // If no local stream is present ( i.e. no input audio devices) we use the screen share audio
        // stream as we would use a regular stream.
        await conference.replaceTrack(null, desktopAudioTrack);
    }
}

/**
 * Toggles screen sharing.
 *
 * @private
 * @param {boolean} enabled - The state to toggle screen sharing to.
 * @param {Store} store - The redux store.
 * @returns {void}
 */
async function _toggleScreenSharing({ enabled, audioOnly = false }, store) {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const localAudio = getLocalJitsiAudioTrack(state);
    const localScreenshare = getLocalDesktopTrack(state['features/base/tracks']);

    if (enabled) {
        let tracks;

        try {
            tracks = await createLocalTracksF({ devices: [ VIDEO_TYPE.DESKTOP ] });
        } catch (error) {
            _handleScreensharingError(error, store);

            return;
        }
        const desktopAudioTrack = tracks.find(track => track.getType() === MEDIA_TYPE.AUDIO);
        const desktopVideoTrack = tracks.find(track => track.getType() === MEDIA_TYPE.VIDEO);

        // Dispose the desktop track for audio-only screensharing.
        if (audioOnly) {
            desktopVideoTrack.dispose();

            if (!desktopAudioTrack) {
                _handleScreensharingError(AUDIO_ONLY_SCREEN_SHARE_NO_TRACK, store);

                return;
            }
        } else if (desktopVideoTrack) {
            if (localScreenshare) {
                await dispatch(replaceLocalTrack(localScreenshare.jitsiTrack, desktopVideoTrack, conference));
            } else {
                await dispatch(addLocalTrack(desktopVideoTrack));
            }
        }

        // Apply the AudioMixer effect if there is a local audio track, add the desktop track to the conference
        // otherwise without unmuting the microphone.
        if (desktopAudioTrack) {
            _maybeApplyAudioMixerEffect(desktopAudioTrack, state);
            dispatch(setScreenshareAudioTrack(desktopAudioTrack));
        }

        // Disable audio-only or best performance mode if the user starts screensharing. This doesn't apply to
        // audio-only screensharing.
        const { enabled: bestPerformanceMode } = state['features/base/audio-only'];

        if (bestPerformanceMode && !audioOnly) {
            dispatch(setAudioOnly(false));
        }
    } else {
        const { desktopAudioTrack } = state['features/screen-share'];

        // Mute the desktop track instead of removing it from the conference since we don't want the client to signal
        // a source-remove to the remote peer for the screenshare track. Later when screenshare is enabled again, the
        // same sender will be re-used without the need for signaling a new ssrc through source-add.
        dispatch(setScreenshareMuted(true));
        if (desktopAudioTrack) {
            if (localAudio) {
                localAudio.setEffect(undefined);
            } else {
                await conference.replaceTrack(desktopAudioTrack, null);
            }
            desktopAudioTrack.dispose();
            dispatch(setScreenshareAudioTrack(null));
        }
    }

    if (audioOnly) {
        dispatch(setScreenAudioShareState(enabled));
    }
}
