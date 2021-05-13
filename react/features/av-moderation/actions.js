import {
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION, PARTICIPANT_APPROVED,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION
} from './actionTypes';

/**
 * Audio or video moderation is disabled.
 *
 * @param {MediaType} mediaType - The media type that was disabled.
 * @param {JitsiParticipant} actor - The actor disabling.
 * @returns {{
 *     type: REQUEST_DISABLE_MODERATED_AUDIO
 * }}
 */
export const disableModeration = (mediaType, actor) => {
    return {
        type: DISABLE_MODERATION,
        mediaType,
        actor
    };
};

/**
 * Audio or video moderation is enabled.
 *
 * @param {MediaType} mediaType - The media type that was enabled.
 * @param {JitsiParticipant} actor - The actor enabling.
 * @returns {{
 *     type: REQUEST_ENABLE_MODERATED_AUDIO
 * }}
 */
export const enableModeration = (mediaType, actor) => {
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
export const requestDisableModeration = mediaType => {
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
export const requestEnableModeration = mediaType => {
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
export const localParticipantApproved = mediaType => {
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
 * A participant was approved to unmute for a mediaType.
 *
 * @param {JitsiParticipant} participant - The {@link JitsiParticipant} instance which was approved.
 * @param {MediaType} mediaType - The media type which was approved.
 * @returns {{
 *     type: PARTICIPANT_APPROVED,
 * }}
 */
export function participantApproved(participant, mediaType) {
    return {
        type: PARTICIPANT_APPROVED,
        mediaType,
        participant
    };
}
