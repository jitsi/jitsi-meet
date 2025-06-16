import { IStore } from '../../app/types';
import { showModeratedNotification } from '../../av-moderation/actions';
import { shouldShowModeratedNotification } from '../../av-moderation/functions';
import { isModerationNotificationDisplayed } from '../../notifications/functions';

import {
    GUM_PENDING,
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_AUDIO_UNMUTE_PERMISSIONS,
    SET_CAMERA_FACING_MODE,
    SET_INITIAL_GUM_PROMISE,
    SET_SCREENSHARE_MUTED,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    SET_VIDEO_UNMUTE_PERMISSIONS,
    STORE_VIDEO_TRANSFORM,
    TOGGLE_CAMERA_FACING_MODE
} from './actionTypes';
import {
    MEDIA_TYPE,
    MediaType,
    SCREENSHARE_MUTISM_AUTHORITY,
    VIDEO_MUTISM_AUTHORITY
} from './constants';
import { IGUMPendingState } from './types';

/**
 * Action to adjust the availability of the local audio.
 *
 * @param {boolean} available - True if the local audio is to be marked as
 * available or false if the local audio is not available.
 * @returns {{
 *     type: SET_AUDIO_AVAILABLE,
 *     available: boolean
 * }}
 */
export function setAudioAvailable(available: boolean) {
    return {
        type: SET_AUDIO_AVAILABLE,
        available
    };
}

/**
 * Action to set the muted state of the local audio.
 *
 * @param {boolean} muted - True if the local audio is to be muted or false if
 * the local audio is to be unmuted.
 * @param {boolean} ensureTrack - True if we want to ensure that a new track is
 * created if missing.
 * @returns {{
 *     type: SET_AUDIO_MUTED,
 *     ensureTrack: boolean,
 *     muted: boolean
 * }}
 */
export function setAudioMuted(muted: boolean, ensureTrack = false) {
    return {
        type: SET_AUDIO_MUTED,
        ensureTrack,
        muted
    };
}

/**
 * Action to disable/enable the audio mute icon.
 *
 * @param {boolean} blocked - True if the audio mute icon needs to be disabled.
 * @param {boolean|undefined} skipNotification - True if we want to skip showing the notification.
 * @returns {Function}
 */
export function setAudioUnmutePermissions(blocked: boolean, skipNotification = false) {
    return {
        type: SET_AUDIO_UNMUTE_PERMISSIONS,
        blocked,
        skipNotification
    };
}

/**
 * Action to set the facing mode of the local camera.
 *
 * @param {CAMERA_FACING_MODE} cameraFacingMode - The camera facing mode to set.
 * @returns {{
 *     type: SET_CAMERA_FACING_MODE,
 *     cameraFacingMode: CAMERA_FACING_MODE
 * }}
 */
export function setCameraFacingMode(cameraFacingMode: string) {
    return {
        type: SET_CAMERA_FACING_MODE,
        cameraFacingMode
    };
}

/**
 * Sets the initial GUM promise.
 *
 * @param {Promise<Array<Object>> | undefined} promise - The promise.
 * @returns {{
 *     type: SET_INITIAL_GUM_PROMISE,
 *     promise: Promise
 * }}
 */
export function setInitialGUMPromise(promise: Promise<{ errors: any; tracks: Array<any>; }> | null = null) {
    return {
        type: SET_INITIAL_GUM_PROMISE,
        promise
    };
}

/**
 * Action to set the muted state of the local screenshare.
 *
 * @param {boolean} muted - True if the local screenshare is to be enabled or false otherwise.
 * @param {number} authority - The {@link SCREENSHARE_MUTISM_AUTHORITY} which is muting/unmuting the local screenshare.
 * @param {boolean} ensureTrack - True if we want to ensure that a new track is created if missing.
 * @returns {Function}
 */
export function setScreenshareMuted(
        muted: boolean,
        authority: number = SCREENSHARE_MUTISM_AUTHORITY.USER,
        ensureTrack = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        // check for A/V Moderation when trying to unmute
        if (!muted && shouldShowModeratedNotification(MEDIA_TYPE.SCREENSHARE, state)) {
            if (!isModerationNotificationDisplayed(MEDIA_TYPE.SCREENSHARE, state)) {
                ensureTrack && dispatch(showModeratedNotification(MEDIA_TYPE.SCREENSHARE));
            }

            return;
        }

        const oldValue = state['features/base/media'].screenshare.muted;

        // eslint-disable-next-line no-bitwise
        const newValue = muted ? oldValue | authority : oldValue & ~authority;

        dispatch({
            type: SET_SCREENSHARE_MUTED,
            authority,
            ensureTrack,
            muted: newValue
        });
    };
}

/**
 * Action to adjust the availability of the local video.
 *
 * @param {boolean} available - True if the local video is to be marked as
 * available or false if the local video is not available.
 * @returns {{
 *     type: SET_VIDEO_AVAILABLE,
 *     available: boolean
 * }}
 */
export function setVideoAvailable(available: boolean) {
    return {
        type: SET_VIDEO_AVAILABLE,
        available
    };
}

/**
 * Action to set the muted state of the local video.
 *
 * @param {boolean} muted - True if the local video is to be muted or false if
 * the local video is to be unmuted.
 * @param {number} authority - The {@link VIDEO_MUTISM_AUTHORITY} which is
 * muting/unmuting the local video.
 * @param {boolean} ensureTrack - True if we want to ensure that a new track is
 * created if missing.
 * @returns {Function}
 */
export function setVideoMuted(
        muted: boolean | number,
        authority: number = VIDEO_MUTISM_AUTHORITY.USER,
        ensureTrack = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        // check for A/V Moderation when trying to unmute
        if (!muted && shouldShowModeratedNotification(MEDIA_TYPE.VIDEO, state)) {
            if (!isModerationNotificationDisplayed(MEDIA_TYPE.VIDEO, state)) {
                ensureTrack && dispatch(showModeratedNotification(MEDIA_TYPE.VIDEO));
            }

            return;
        }

        const oldValue = state['features/base/media'].video.muted;

        // eslint-disable-next-line no-bitwise
        const newValue = muted ? oldValue | authority : oldValue & ~authority;

        dispatch({
            type: SET_VIDEO_MUTED,
            authority,
            ensureTrack,
            muted: newValue
        });
    };
}

/**
 * Action to disable/enable the video mute icon.
 *
 * @param {boolean} blocked - True if the video mute icon needs to be disabled.
 * @param {boolean|undefined} skipNotification - True if we want to skip showing the notification.
 * @returns {Function}
 */
export function setVideoUnmutePermissions(blocked: boolean, skipNotification = false) {
    return {
        type: SET_VIDEO_UNMUTE_PERMISSIONS,
        blocked,
        skipNotification
    };
}

/**
 * Creates an action to store the last video {@link Transform} applied to a
 * stream.
 *
 * @param {string} streamId - The ID of the stream.
 * @param {Object} transform - The {@code Transform} to store.
 * @returns {{
 *     type: STORE_VIDEO_TRANSFORM,
 *     streamId: string,
 *     transform: Object
 * }}
 */
export function storeVideoTransform(streamId: string, transform: Object) {
    return {
        type: STORE_VIDEO_TRANSFORM,
        streamId,
        transform
    };
}

/**
 * Toggles the camera facing mode. Most commonly, for example, mobile devices
 * such as phones have a front/user-facing and a back/environment-facing
 * cameras. In contrast to setCameraFacingMode, allows the toggling to be
 * optimally and/or natively implemented without the overhead of separate reads
 * and writes of the current/effective camera facing mode.
 *
 * @returns {{
 *     type: TOGGLE_CAMERA_FACING_MODE
 * }}
 */
export function toggleCameraFacingMode() {
    return {
        type: TOGGLE_CAMERA_FACING_MODE
    };
}

/**
 * Sets the GUM pending status from unmute and initial track creation operation.
 *
 * @param {Array<MediaType>} mediaTypes - An array with the media types that GUM is called with.
 * @param {IGUMPendingState} status - The GUM status.
 * @returns {{
 *     type: TOGGLE_CAMERA_FACING_MODE,
 *     mediaTypes: Array<MediaType>,
 *     status: IGUMPendingState
 * }}
 */
export function gumPending(mediaTypes: Array<MediaType>, status: IGUMPendingState) {
    return {
        type: GUM_PENDING,
        mediaTypes,
        status
    };
}
