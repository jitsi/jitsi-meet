// @flow

import { AUDIO_ONLY_SCREEN_SHARE_NO_TRACK } from '../../../../modules/UI/UIErrors';
import UIEvents from '../../../../service/UI/UIEvents';
import { showModeratedNotification } from '../../av-moderation/actions';
import { shouldShowModeratedNotification } from '../../av-moderation/functions';
import { setNoiseSuppressionEnabled } from '../../noise-suppression/actions';
import {
    showNotification,
    NOTIFICATION_TIMEOUT_TYPE,
    isModerationNotificationDisplayed
} from '../../notifications';
import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin';
import {
    isAudioOnlySharing,
    isScreenVideoShared,
    setScreenAudioShareState,
    setScreenshareAudioTrack
} from '../../screen-share';
import { isScreenshotCaptureEnabled, toggleScreenshotCaptureSummary } from '../../screenshot-capture';
import { AudioMixerEffect } from '../../stream-effects/audio-mixer/AudioMixerEffect';
import { setAudioOnly } from '../audio-only';
import { getMultipleVideoSendingSupportFeatureFlag } from '../config/functions.any';
import { JitsiConferenceErrors, JitsiTrackErrors, JitsiTrackEvents } from '../lib-jitsi-meet';
import { MEDIA_TYPE, setScreenshareMuted, VIDEO_TYPE } from '../media';
import { MiddlewareRegistry } from '../redux';
import {
    addLocalTrack,
    createLocalTracksF,
    getLocalDesktopTrack,
    getLocalJitsiAudioTrack,
    replaceLocalTrack,
    toggleScreensharing,
    TOGGLE_SCREENSHARING
} from '../tracks';

import { CONFERENCE_FAILED, CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_JOINED } from './actionTypes';
import { getCurrentConference } from './functions';
import './middleware.any';

declare var APP: Object;

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
        const errorName = action.error?.name;

        if (enableForcedReload && errorName === JitsiConferenceErrors.CONFERENCE_RESTARTED) {
            dispatch(setSkipPrejoinOnReload(true));
        }

        break;
    }
    case TOGGLE_SCREENSHARING:
        if (typeof APP === 'object') {
            // check for A/V Moderation when trying to start screen sharing
            if ((action.enabled || action.enabled === undefined)
                && shouldShowModeratedNotification(MEDIA_TYPE.VIDEO, store.getState())) {
                if (!isModerationNotificationDisplayed(MEDIA_TYPE.PRESENTER, store.getState())) {
                    store.dispatch(showModeratedNotification(MEDIA_TYPE.PRESENTER));
                }

                return;
            }

            const { enabled, audioOnly, ignoreDidHaveVideo } = action;

            if (getMultipleVideoSendingSupportFeatureFlag(store.getState())) {
                _toggleScreenSharing(action, store);
            } else {
                APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING,
                    {
                        enabled,
                        audioOnly,
                        ignoreDidHaveVideo
                    });
            }
        }
        break;
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
async function _toggleScreenSharing({ enabled, audioOnly = false, shareOptions = {} }, store) {
    const { dispatch, getState } = store;
    const state = getState();
    const audioOnlySharing = isAudioOnlySharing(state);
    const screenSharing = isScreenVideoShared(state);
    const conference = getCurrentConference(state);
    const localAudio = getLocalJitsiAudioTrack(state);
    const localScreenshare = getLocalDesktopTrack(state['features/base/tracks']);

    // Toggle screenshare or audio-only share if the new state is not passed. Happens in the following two cases.
    // 1. ShareAudioDialog passes undefined when the user hits continue in the share audio demo modal.
    // 2. Toggle screenshare called from the external API.
    const enable = audioOnly
        ? enabled ?? !audioOnlySharing
        : enabled ?? !screenSharing;
    const screensharingDetails = {};

    if (enable) {
        let tracks;
        const options = {
            devices: [ VIDEO_TYPE.DESKTOP ],
            ...shareOptions
        };

        try {
            tracks = await createLocalTracksF(options);
        } catch (error) {
            _handleScreensharingError(error, store);

            return;
        }
        const desktopAudioTrack = tracks.find(track => track.getType() === MEDIA_TYPE.AUDIO);
        const desktopVideoTrack = tracks.find(track => track.getType() === MEDIA_TYPE.VIDEO);

        if (audioOnly) {
            // Dispose the desktop track for audio-only screensharing.
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
            if (isScreenshotCaptureEnabled(state, false, true)) {
                dispatch(toggleScreenshotCaptureSummary(true));
            }
            screensharingDetails.sourceType = desktopVideoTrack.sourceType;
        }

        // Apply the AudioMixer effect if there is a local audio track, add the desktop track to the conference
        // otherwise without unmuting the microphone.
        if (desktopAudioTrack) {
            // Noise suppression doesn't work with desktop audio because we can't chain track effects yet, disable it
            // first. We need to to wait for the effect to clear first or it might interfere with the audio mixer.
            await dispatch(setNoiseSuppressionEnabled(false));
            _maybeApplyAudioMixerEffect(desktopAudioTrack, state);
            dispatch(setScreenshareAudioTrack(desktopAudioTrack));

            // Handle the case where screen share was stopped from the browsers 'screen share in progress' window.
            if (audioOnly) {
                desktopAudioTrack?.on(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => dispatch(toggleScreensharing(undefined, true)));
            }
        }

        // Disable audio-only or best performance mode if the user starts screensharing. This doesn't apply to
        // audio-only screensharing.
        const { enabled: bestPerformanceMode } = state['features/base/audio-only'];

        if (bestPerformanceMode && !audioOnly) {
            dispatch(setAudioOnly(false));
        }
    } else {
        const { desktopAudioTrack } = state['features/screen-share'];

        dispatch(toggleScreenshotCaptureSummary(false));

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
        dispatch(setScreenAudioShareState(enable));
    } else {
        // Notify the external API.
        APP.API.notifyScreenSharingStatusChanged(enable, screensharingDetails);
    }
}
