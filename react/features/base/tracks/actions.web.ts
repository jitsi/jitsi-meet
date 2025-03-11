// @ts-expect-error
import { AUDIO_ONLY_SCREEN_SHARE_NO_TRACK } from '../../../../modules/UI/UIErrors';
import { IReduxState, IStore } from '../../app/types';
import { showModeratedNotification } from '../../av-moderation/actions';
import { shouldShowModeratedNotification } from '../../av-moderation/functions';
import { setNoiseSuppressionEnabled } from '../../noise-suppression/actions';
import { showErrorNotification, showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { stopReceiver } from '../../remote-control/actions';
import { setScreenAudioShareState, setScreenshareAudioTrack } from '../../screen-share/actions';
import { isAudioOnlySharing, isScreenVideoShared } from '../../screen-share/functions';
import { toggleScreenshotCaptureSummary } from '../../screenshot-capture/actions';
import { isScreenshotCaptureEnabled } from '../../screenshot-capture/functions';
import { AudioMixerEffect } from '../../stream-effects/audio-mixer/AudioMixerEffect';
import { getCurrentConference } from '../conference/functions';
import { notifyCameraError, notifyMicError } from '../devices/actions.web';
import { openDialog } from '../dialog/actions';
import { JitsiTrackErrors, JitsiTrackEvents, browser } from '../lib-jitsi-meet';
import { createLocalTrack } from '../lib-jitsi-meet/functions.any';
import { gumPending, setScreenshareMuted } from '../media/actions';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    MediaType,
    VIDEO_TYPE,
} from '../media/constants';
import { IGUMPendingState } from '../media/types';
import { updateSettings } from '../settings/actions';

import { addLocalTrack, replaceLocalTrack } from './actions.any';
import AllowToggleCameraDialog from './components/web/AllowToggleCameraDialog';
import {
    createLocalTracksF,
    getLocalDesktopTrack,
    getLocalJitsiAudioTrack,
    getLocalVideoTrack,
    isToggleCameraEnabled
} from './functions';
import logger from './logger';
import { ICreateInitialTracksOptions, IInitialTracksErrors, IShareOptions, IToggleScreenSharingOptions } from './types';

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
            dispatch(showModeratedNotification(MEDIA_TYPE.SCREENSHARE));

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
        await conference?.replaceTrack(null, desktopAudioTrack);
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
    const localAudio = getLocalJitsiAudioTrack(state);
    const localScreenshare = getLocalDesktopTrack(state['features/base/tracks']);

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
                dispatch(handleScreenSharingError(error));

                return;
            }
        }

        const desktopAudioTrack = tracks.find(track => track.getType() === MEDIA_TYPE.AUDIO);
        const desktopVideoTrack = tracks.find(track => track.getType() === MEDIA_TYPE.VIDEO);

        if (audioOnly) {
            // Dispose the desktop track for audio-only screensharing.
            desktopVideoTrack.dispose();

            if (!desktopAudioTrack) {
                dispatch(handleScreenSharingError(AUDIO_ONLY_SCREEN_SHARE_NO_TRACK));

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

        // Show notification about more bandwidth usage in audio-only mode if the user starts screensharing. This
        // doesn't apply to audio-only screensharing.
        const { enabled: bestPerformanceMode } = state['features/base/audio-only'];

        if (bestPerformanceMode && !audioOnly) {
            dispatch(showNotification({
                titleKey: 'notify.screenSharingAudioOnlyTitle',
                descriptionKey: 'notify.screenSharingAudioOnlyDescription'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }
    } else {
        const { desktopAudioTrack } = state['features/screen-share'];

        dispatch(stopReceiver());

        dispatch(toggleScreenshotCaptureSummary(false));

        // Mute the desktop track instead of removing it from the conference since we don't want the client to signal
        // a source-remove to the remote peer for the screenshare track. Later when screenshare is enabled again, the
        // same sender will be re-used without the need for signaling a new ssrc through source-add.
        dispatch(setScreenshareMuted(true));
        if (desktopAudioTrack) {
            if (localAudio) {
                localAudio.setEffect(undefined);
            } else {
                await conference?.replaceTrack(desktopAudioTrack, null);
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

/**
 * Sets the camera facing mode(environment/user). If facing mode not provided, it will do a toggle.
 *
 * @param {string | undefined} facingMode - The selected facing mode.
 * @returns {void}
 */
export function setCameraFacingMode(facingMode: string | undefined) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (!isToggleCameraEnabled(state)) {
            return;
        }

        if (!facingMode) {
            dispatch(toggleCamera());

            return;
        }

        const tracks = state['features/base/tracks'];
        const localVideoTrack = getLocalVideoTrack(tracks)?.jitsiTrack;

        if (!tracks || !localVideoTrack) {
            return;
        }

        const currentFacingMode = localVideoTrack.getCameraFacingMode();

        if (currentFacingMode !== facingMode) {
            dispatch(toggleCamera());
        }
    };
}

/**
 * Signals to open the permission dialog for toggling camera remotely.
 *
 * @param {Function} onAllow - Callback to be executed if permission to toggle camera was granted.
 * @param {string} initiatorId - The participant id of the requester.
 * @returns {Object} - The open dialog action.
 */
export function openAllowToggleCameraDialog(onAllow: Function, initiatorId: string) {
    return openDialog(AllowToggleCameraDialog, {
        onAllow,
        initiatorId
    });
}

/**
 * Sets the GUM pending state for the tracks that have failed.
 *
 * NOTE: Some of the track that we will be setting to GUM pending state NONE may not have failed but they may have
 * been requested. This won't be a problem because their current GUM pending state will be NONE anyway.
 *
 * @param {JitsiLocalTrack} tracks - The tracks that have been created.
 * @param {Function} dispatch - The redux dispatch function.
 * @returns {void}
 */
export function setGUMPendingStateOnFailedTracks(tracks: Array<any>, dispatch: IStore['dispatch']) {
    const tracksTypes = tracks.map(track => {
        if (track.getVideoType() === VIDEO_TYPE.DESKTOP) {
            return MEDIA_TYPE.SCREENSHARE;
        }

        return track.getType();
    });
    const nonPendingTracks = [ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ].filter(type => !tracksTypes.includes(type));

    dispatch(gumPending(nonPendingTracks, IGUMPendingState.NONE));
}

/**
 * Creates and adds to the conference the initial audio/video tracks.
 *
 * @param {Array<MediaType>} devices - Array with devices (audio/video) that will be used.
 * @returns {Function}
 */
export function createAndAddInitialAVTracks(devices: Array<MediaType>) {
    return async (dispatch: IStore['dispatch']) => {
        dispatch(gumPending(devices, IGUMPendingState.PENDING_UNMUTE));

        const { tracks, errors } = await dispatch(createInitialAVTracks({ devices }));

        setGUMPendingStateOnFailedTracks(tracks, dispatch);
        dispatch(displayErrorsForCreateInitialLocalTracks(errors));

        await Promise.allSettled(tracks.map((track: any) => {
            const legacyConferenceObject = APP.conference;

            if (track.isAudioTrack()) {
                return legacyConferenceObject.useAudioStream(track);
            }
            if (track.isVideoTrack()) {
                return legacyConferenceObject.useVideoStream(track);
            }

            return Promise.resolve();
        }));

        dispatch(gumPending(devices, IGUMPendingState.NONE));
    };
}

/**
 * Creates the initial audio/video tracks.
 *
 * @param {ICreateInitialTracksOptions} options - Options for creating the audio/video tracks.
 * @param {boolean} recordTimeMetrics - If true time metrics will be recorded.
 * @returns {Function}
 */
export function createInitialAVTracks(options: ICreateInitialTracksOptions, recordTimeMetrics = false) {
    return (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        const {
            devices,
            timeout
        } = options;

        dispatch(gumPending(devices, IGUMPendingState.PENDING_UNMUTE));

        return createLocalTracksF(options, undefined, recordTimeMetrics).then(tracks => {
            return {
                errors: {} as IInitialTracksErrors,
                tracks
            };
        })
        .catch(async error => {
            const errors = {} as IInitialTracksErrors;

            if (error.name === JitsiTrackErrors.TIMEOUT && !browser.isElectron()) {
                if (devices.includes(MEDIA_TYPE.AUDIO)) {
                    errors.audioOnlyError = error;
                }

                if (devices.includes(MEDIA_TYPE.VIDEO)) {
                    errors.videoOnlyError = error;
                }

                if (errors.audioOnlyError && errors.videoOnlyError) {
                    errors.audioAndVideoError = error;
                }

                return {
                    errors,
                    tracks: []
                };
            }

            // Retry with separate gUM calls.
            const gUMPromises = [];
            const tracks: any[] | PromiseLike<any[]> = [];

            if (devices.includes(MEDIA_TYPE.AUDIO)) {
                gUMPromises.push(createLocalTracksF({
                    devices: [ MEDIA_TYPE.AUDIO ],
                    timeout
                }));
            }

            if (devices.includes(MEDIA_TYPE.VIDEO)) {
                gUMPromises.push(createLocalTracksF({
                    devices: [ MEDIA_TYPE.VIDEO ],
                    timeout
                }));
            }

            const results = await Promise.allSettled(gUMPromises);
            let errorMsg;

            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    tracks.push(result.value[0]);
                } else {
                    errorMsg = result.reason;
                    const isAudio = idx === 0;

                    logger.error(`${isAudio ? 'Audio' : 'Video'} track creation failed with error ${errorMsg}`);
                    if (isAudio) {
                        errors.audioOnlyError = errorMsg;
                    } else {
                        errors.videoOnlyError = errorMsg;
                    }
                }
            });

            if (errors.audioOnlyError && errors.videoOnlyError) {
                errors.audioAndVideoError = errorMsg;
            }

            return {
                tracks,
                errors
            };
        });
    };
}

/**
 * Displays error notifications according to the state carried by the passed {@code errors} object.
 *
 * @param {InitialTracksErrors} errors - The errors (if any).
 * @returns {Function}
 * @private
 */
export function displayErrorsForCreateInitialLocalTracks(errors: IInitialTracksErrors) {
    return (dispatch: IStore['dispatch']) => {
        const {
            audioOnlyError,
            screenSharingError,
            videoOnlyError
        } = errors;

        if (screenSharingError) {
            dispatch(handleScreenSharingError(screenSharingError));
        }
        if (audioOnlyError || videoOnlyError) {
            if (audioOnlyError) {
                dispatch(notifyMicError(audioOnlyError));
            }

            if (videoOnlyError) {
                dispatch(notifyCameraError(videoOnlyError));
            }
        }
    };
}

/**
 * Displays a UI notification for screensharing failure based on the error passed.
 *
 * @private
 * @param {Error | AUDIO_ONLY_SCREEN_SHARE_NO_TRACK} error - The error.
 * @returns {Function}
 */
export function handleScreenSharingError(
        error: Error | AUDIO_ONLY_SCREEN_SHARE_NO_TRACK) {
    return (dispatch: IStore['dispatch']) => {
        logger.error('failed to share local desktop', error);

        let descriptionKey;
        let titleKey;

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
        } else { // safeguard for not showing notification with empty text. This will also include
            // error.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED
            return;
        }

        dispatch(showErrorNotification({
            descriptionKey,
            titleKey
        }));
    };
}

/**
 * Toggles the facingMode constraint on the video stream.
 *
 * @returns {Function}
 */
export function toggleCamera() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const tracks = state['features/base/tracks'];
        const localVideoTrack = getLocalVideoTrack(tracks)?.jitsiTrack;
        const currentFacingMode = localVideoTrack.getCameraFacingMode();
        const { localFlipX } = state['features/base/settings'];
        const targetFacingMode = currentFacingMode === CAMERA_FACING_MODE.USER
            ? CAMERA_FACING_MODE.ENVIRONMENT
            : CAMERA_FACING_MODE.USER;

        // Update the flipX value so the environment facing camera is not flipped, before the new track is created.
        dispatch(updateSettings({ localFlipX: targetFacingMode === CAMERA_FACING_MODE.USER ? localFlipX : false }));

        // On mobile only one camera can be open at a time, so first stop the current camera track.
        await dispatch(replaceLocalTrack(localVideoTrack, null));

        const newVideoTrack = await createLocalTrack('video', null, null, { facingMode: targetFacingMode });

        await dispatch(replaceLocalTrack(null, newVideoTrack));
    };
}
