// @flow

import { getConferenceState } from '../base/conference';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';

import {
    DISMISS_PENDING_PARTICIPANT,
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION
} from './actionTypes';

/**
 * Action used by moderator to approve audio for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveAudio = (id: string) => (dispatch: Function, getState: Function) => {
    const { conference } = getConferenceState(getState());

    conference.avModerationApprove(MEDIA_TYPE.AUDIO, id);
};

/**
 * Audio or video moderation is disabled.
 *
 * @param {MediaType} mediaType - The media type that was disabled.
 * @param {JitsiParticipant} actor - The actor disabling.
 * @returns {{
 *     type: REQUEST_DISABLE_MODERATED_AUDIO
 * }}
 */
export const disableModeration = (mediaType: MediaType, actor: Object) => {
    return {
        type: DISABLE_MODERATION,
        mediaType,
        actor
    };
};


/**
 * Hides the notification with the participant that asked to unmute audio.
 *
 * @param {string} id - The participant id.
 * @returns {Object}
 */
export function dismissPendingAudioParticipant(id: string) {
    return dismissPendingParticipant(id, MEDIA_TYPE.AUDIO);
}

/**
 * Hides the notification with the participant that asked to unmute.
 *
 * @param {string} id - The participant id.
 * @param {MediaType} mediaType - The media type.
 * @returns {Object}
 */
export function dismissPendingParticipant(id: string, mediaType: MediaType) {
    return {
        type: DISMISS_PENDING_PARTICIPANT,
        id,
        mediaType
    };
}

/**
 * Audio or video moderation is enabled.
 *
 * @param {MediaType} mediaType - The media type that was enabled.
 * @param {JitsiParticipant} actor - The actor enabling.
 * @returns {{
 *     type: REQUEST_ENABLE_MODERATED_AUDIO
 * }}
 */
export const enableModeration = (mediaType: MediaType, actor: Object) => {
    return {
        type: ENABLE_MODERATION,
        mediaType,
        actor
    };
};

/**
 * Requests disable of audio or video moderation.
 *
 * @param {MediaType} mediaType - The media type to disable.
 * @returns {{
 *     type: REQUEST_DISABLE_MODERATED_AUDIO
 * }}
 */
export const requestDisableModeration = (mediaType: MediaType) => {
    return {
        type: REQUEST_DISABLE_MODERATION,
        mediaType
    };
};

/**
 * Requests enabled of audio or video moderation.
 *
 * @param {MediaType} mediaType - The media type to enable.
 * @returns {{
 *     type: REQUEST_ENABLE_MODERATED_AUDIO
 * }}
 */
export const requestEnableModeration = (mediaType: MediaType) => {
    return {
        type: REQUEST_ENABLE_MODERATION,
        mediaType
    };
};

/**
 * Local participant was approved to be able to unmute audio or video.
 *
 * @param {MediaType} mediaType - The media type that was approved.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_APPROVED
 * }}
 */
export const localParticipantApproved = (mediaType: MediaType) => {
    return {
        type: LOCAL_PARTICIPANT_APPROVED,
        mediaType
    };
};

/**
 * Shows notification when A/V moderation is enabled and local participant is still not approved.
 *
 * @returns {{
 *     type: LOCAL_PARTICIPANT_MODERATION_NOTIFICATION
 * }}
 */
export function showModeratedNotification() {
    return {
        type: LOCAL_PARTICIPANT_MODERATION_NOTIFICATION
    };
}

/**
 * Shows a notification with the participant that asked to audio unmute.
 *
 * @param {string} id - The participant id.
 * @returns {Object}
 */
export function participantPendingAudio(id: string) {
    return {
        type: PARTICIPANT_PENDING_AUDIO,
        id
    };
}

/**
 * A participant was approved to unmute for a mediaType.
 *
 * @param {string} id - The id of the approved participant.
 * @param {MediaType} mediaType - The media type which was approved.
 * @returns {{
 *     type: PARTICIPANT_APPROVED,
 * }}
 */
export function participantApproved(id: string, mediaType: MediaType) {
    return {
        type: PARTICIPANT_APPROVED,
        id,
        mediaType
    };
}
