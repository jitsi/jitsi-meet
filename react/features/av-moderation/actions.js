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
 * Action used by moderator to approve audio and video for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipant = (id: string) => (dispatch: Function, getState: Function) => {
    const { conference } = getConferenceState(getState());

    conference.avModerationApprove(MEDIA_TYPE.AUDIO, id);
    conference.avModerationApprove(MEDIA_TYPE.VIDEO, id);
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
 * @param {Object} participant - The participant for which the notification to be hidden.
 * @returns {Object}
 */
export function dismissPendingAudioParticipant(participant: Object) {
    return dismissPendingParticipant(participant.id, MEDIA_TYPE.AUDIO);
}

/**
 * Hides the notification with the participant that asked to unmute.
 *
 * @param {string} id - The participant id for which the notification to be hidden.
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
 * Requests disable of audio and video moderation.
 *
 * @returns {{
 *     type: REQUEST_DISABLE_MODERATED_AUDIO
 * }}
 */
export const requestDisableModeration = () => {
    return {
        type: REQUEST_DISABLE_MODERATION
    };
};

/**
 * Requests enabled audio & video moderation.
 *
 * @returns {{
 *     type: REQUEST_ENABLE_MODERATED_AUDIO
 * }}
 */
export const requestEnableModeration = () => {
    return {
        type: REQUEST_ENABLE_MODERATION
    };
};

/**
 * Local participant was approved to be able to unmute audio and video.
 *
 * @param {MediaType} mediaType - The media type to disable.
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
 * @param {MediaType} mediaType - Audio or video media type.
 * @returns {Object}
 */
export function showModeratedNotification(mediaType: MediaType) {
    return {
        type: LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
        mediaType
    };
}

/**
 * Shows a notification with the participant that asked to audio unmute.
 *
 * @param {Object} participant - The participant for which is the notification.
 * @returns {Object}
 */
export function participantPendingAudio(participant: Object) {
    return {
        type: PARTICIPANT_PENDING_AUDIO,
        participant
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
