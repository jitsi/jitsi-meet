/* eslint-disable lines-around-comment */
// @ts-expect-error
import { AUDIO_ONLY_SCREEN_SHARE_NO_TRACK } from '../../../../modules/UI/UIErrors';
import { IReduxState, IStore } from '../../app/types';
import { shouldShowModeratedNotification } from '../../av-moderation/functions';
import { setNoiseSuppressionEnabled } from '../../noise-suppression/actions';
import { showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
// @ts-ignore
import { stopReceiver } from '../../remote-control/actions';
import { setScreenAudioShareState, setScreenshareAudioTrack } from '../../screen-share/actions';
import { isAudioOnlySharing, isScreenVideoShared } from '../../screen-share/functions';
// @ts-ignore
import { isScreenshotCaptureEnabled, toggleScreenshotCaptureSummary } from '../../screenshot-capture';
// @ts-ignore
import { AudioMixerEffect } from '../../stream-effects/audio-mixer/AudioMixerEffect';
import { setAudioOnly } from '../audio-only/actions';
import { getCurrentConference } from '../conference/functions';
import { JitsiTrackErrors, JitsiTrackEvents } from '../lib-jitsi-meet';
import { createLocalTrack } from '../lib-jitsi-meet/functions.any';
import { setScreenshareMuted } from '../media/actions';
import { CAMERA_FACING_MODE, MEDIA_TYPE, VIDEO_TYPE } from '../media/constants';
import { updateSettings } from '../settings/actions';
/* eslint-enable lines-around-comment */

import { SET_TRACK_OPERATIONS_PROMISE } from './actionTypes';
import {
    addLocalTrack,
    replaceLocalTrack
} from './actions.any';
import {
    createLocalTracksF,
    getLocalDesktopTrack,
    getLocalJitsiAudioTrack,
    getLocalVideoTrack
} from './functions';
import { IShareOptions, IToggleScreenSharingOptions, TrackOperationType } from './types';

export * from './actions.any';

/**
 * Signals that the local participant is ending screensharing or beginning the screensharing flow.
 *
 * @param {boolean} enabled - The state to toggle screen sharing to.
 * @param {boolean} audioOnly - Only share system audio.
 * @param {Object} shareOptions - The options to be passed for capturing screenshare.
 * @returns {Function}
 */
export function toggleScreensharing(
        enabled?: boolean,
        audioOnly = false,
        shareOptions: IShareOptions = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // check for A/V Moderation when trying to start screen sharing
        if ((enabled || enabled === undefined) && shouldShowModeratedNotification(MEDIA_TYPE.VIDEO, getState())) {

            return Promise.reject();
        }

        return _toggleScreenSharing({
            enabled,
            audioOnly,
            shareOptions
        }, {
            dispatch,
            getState
        });
    };
}

/**
 * Displays a UI notification for screensharing failure based on the error passed.
 *
 * @private
 * @param {Object} error - The error.
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _handleScreensharingError(
        error: Error | AUDIO_ONLY_SCREEN_SHARE_NO_TRACK,
        { dispatch }: IStore): void {
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
async function _maybeApplyAudioMixerEffect(desktopAudioTrack: any, state: IReduxState): Promise<void> {
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
async function _toggleScreenSharing(
        {
            enabled,
            audioOnly = false,
            shareOptions = {}
        }: IToggleScreenSharingOptions,
        store: IStore
): Promise<void> {
    const { dispatch, getState } = store;
    const state = getState();
    const audioOnlySharing = isAudioOnlySharing(state);
    const screenSharing = isScreenVideoShared(state);
    const conference = getCurrentConference(state);

    // Toggle screenshare or audio-only share if the new state is not passed. Happens in the following two cases.
    // 1. ShareAudioDialog passes undefined when the user hits continue in the share audio demo modal.
    // 2. Toggle screenshare called from the external API.
    const enable = audioOnly
        ? enabled ?? !audioOnlySharing
        : enabled ?? !screenSharing;
    const screensharingDetails: { sourceType?: string; } = {};

    if (enable) {
        let tracks;

        // Spot proxy stream.
        if (shareOptions.desktopStream) {
            tracks = [ shareOptions.desktopStream ];
        } else {
            const { _desktopSharingSourceDevice } = state['features/base/config'];

            if (!shareOptions.desktopSharingSources && _desktopSharingSourceDevice) {
                shareOptions.desktopSharingSourceDevice = _desktopSharingSourceDevice;
            }

            const options = {
                devices: [ VIDEO_TYPE.DESKTOP ],
                ...shareOptions
            };

            try {
                tracks = await createLocalTracksF(options) as any[];
            } catch (error) {
                _handleScreensharingError(error as any, store);

                throw error;
            }
        }

        const desktopAudioTrack = tracks.find(track => track.getType() === MEDIA_TYPE.AUDIO);
        const desktopVideoTrack = tracks.find(track => track.getType() === MEDIA_TYPE.VIDEO);

        if (audioOnly) {
            // Dispose the desktop track for audio-only screensharing.
            desktopVideoTrack.dispose();

            if (!desktopAudioTrack) {
                _handleScreensharingError(AUDIO_ONLY_SCREEN_SHARE_NO_TRACK, store);

                throw new Error(AUDIO_ONLY_SCREEN_SHARE_NO_TRACK);
            }
        } else if (desktopVideoTrack) {
            await dispatch(executeTrackOperation(TrackOperationType.Video, async () => {
                const localScreenshare = getLocalDesktopTrack(getState()['features/base/tracks']);

                if (localScreenshare) {
                    await dispatch(replaceLocalTrack(localScreenshare.jitsiTrack, desktopVideoTrack, conference));
                } else {
                    await dispatch(addLocalTrack(desktopVideoTrack));
                }
            }));

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

            dispatch(executeTrackOperation(TrackOperationType.Audio,
                () => _maybeApplyAudioMixerEffect(desktopAudioTrack, state)));
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

        dispatch(stopReceiver());

        dispatch(toggleScreenshotCaptureSummary(false));

        await dispatch(executeTrackOperation(TrackOperationType.Video, () => {
            // Mute the desktop track instead of removing it from the conference since we don't want the client to
            // signal a source-remove to the remote peer for the screenshare track. Later when screenshare is enabled
            // again, the same sender will be re-used without the need for signaling a new ssrc through source-add.
            dispatch(setScreenshareMuted(true));

            return Promise.resolve();
        }));

        if (desktopAudioTrack) {
            await dispatch(executeTrackOperation(TrackOperationType.Audio, async () => {
                const localAudio = getLocalJitsiAudioTrack(state);

                if (localAudio) {
                    await localAudio.setEffect(undefined);
                } else {
                    await conference.replaceTrack(desktopAudioTrack, null);
                }
            }));
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


/**
 * Executes a track operation.
 *
 * @param {TrackOperationType} type - The type of the operation ('audio', 'video' or 'audio-video').
 * @param {Function} operation - The operation.
 * @returns {{
 *      type: SET_TRACK_OPERATIONS_PROMISE,
 *      audioTrackOperationsPromise: Promise<void>,
 *      videoTrackOperationsPromise: Promise<void>
 * }}
 */
export function executeTrackOperation(type: TrackOperationType, operation: () => Promise<any>) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const {
            audioTrackOperationsPromise,
            videoTrackOperationsPromise
        } = getState()['features/base/track-operations'];

        switch (type) {
        case TrackOperationType.Audio: {
            const promise = audioTrackOperationsPromise.then(operation, operation);

            dispatch({
                type: SET_TRACK_OPERATIONS_PROMISE,
                audioTrackOperationsPromise: promise
            });

            return promise;
        }
        case TrackOperationType.Video: {
            const promise = videoTrackOperationsPromise.then(operation, operation);

            dispatch({
                type: SET_TRACK_OPERATIONS_PROMISE,
                videoTrackOperationsPromise: promise
            });

            return promise;
        }
        case TrackOperationType.AudioVideo: {
            const promise = Promise.allSettled([
                audioTrackOperationsPromise,
                videoTrackOperationsPromise
            ]).then(operation, operation);

            dispatch({
                type: SET_TRACK_OPERATIONS_PROMISE,
                audioTrackOperationsPromise: promise,
                videoTrackOperationsPromise: promise
            });

            return promise;
        }
        default: {
            const unexpectedType: never = type;

            return Promise.reject(new Error(`Unexpected track operation type: ${unexpectedType}`));
        }
        }
    };
}

/**
 * Toggles the facingMode constraint on the video stream.
 *
 * @returns {Function}
 */
export function toggleCamera() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) =>
        dispatch(executeTrackOperation(TrackOperationType.Video,

            // eslint-disable-next-line valid-jsdoc
            /**
             * FIXME: Ideally, we should be dispatching {@code replaceLocalTrack} here,
             * but it seems to not trigger the re-rendering of the local video on Chrome;
             * could be due to a plan B vs unified plan issue. Therefore, we use the legacy
             * method defined in conference.js that manually takes care of updating the local
             * video as well.
             */
            () => APP.conference.useVideoStream(null).then(() => {
                const state = getState();
                const tracks = state['features/base/tracks'];
                const localVideoTrack = getLocalVideoTrack(tracks)?.jitsiTrack;
                const currentFacingMode = localVideoTrack.getCameraFacingMode();

                const targetFacingMode = currentFacingMode === CAMERA_FACING_MODE.USER
                    ? CAMERA_FACING_MODE.ENVIRONMENT
                    : CAMERA_FACING_MODE.USER;

                // Update the flipX value so the environment facing camera is not flipped, before the new track is
                // created.
                dispatch(updateSettings({ localFlipX: targetFacingMode === CAMERA_FACING_MODE.USER }));

                return createLocalTrack('video', null, null, { facingMode: targetFacingMode });
            })
            .then((newVideoTrack: any) => APP.conference.useVideoStream(newVideoTrack))));
}
