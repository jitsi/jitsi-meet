import { IStore } from '../app/types';
import { getConferenceState } from '../base/conference/functions';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import { getParticipantById, isParticipantModerator } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { isForceMuted } from '../participants-pane/functions';

import {
    DISABLE_MODERATION,
    DISMISS_PENDING_PARTICIPANT,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    PARTICIPANT_REJECTED,
    REQUEST_DISABLE_AUDIO_MODERATION,
    REQUEST_DISABLE_VIDEO_MODERATION,
    REQUEST_ENABLE_AUDIO_MODERATION,
    REQUEST_ENABLE_VIDEO_MODERATION
} from './actionTypes';
import { isEnabledFromState } from './functions';

/**
 * Action used by moderator to approve audio for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipantAudio = (id: string) => (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);

    const isAudioModerationOn = isEnabledFromState(MEDIA_TYPE.AUDIO, state);
    const isVideoModerationOn = isEnabledFromState(MEDIA_TYPE.VIDEO, state);
    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);

    if (isAudioModerationOn || !isVideoModerationOn || !isVideoForceMuted) {
        conference?.avModerationApprove(MEDIA_TYPE.AUDIO, id);
    }
};

/**
 * Action used by moderator to approve video for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipantVideo = (id: string) => (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const participant = getParticipantById(state, id);

    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);
    const isVideoModerationOn = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    if (isVideoModerationOn && isVideoForceMuted) {
        conference?.avModerationApprove(MEDIA_TYPE.VIDEO, id);
    }
};

/**
 * Action used by moderator to approve audio and video for a participant.
 *
 * @param {staring} id - The id of the participant to be approved.
 * @returns {void}
 */
export const approveParticipant = (id: string) => (dispatch: IStore['dispatch']) => {
    dispatch(approveParticipantAudio(id));
    dispatch(approveParticipantVideo(id));
};

/**
 * Action used by moderator to reject audio for a participant.
 *
 * @param {staring} id - The id of the participant to be rejected.
 * @returns {void}
 */
export const rejectParticipantAudio = (id: string) => (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const audioModeration = isEnabledFromState(MEDIA_TYPE.AUDIO, state);

    const participant = getParticipantById(state, id);
    const isAudioForceMuted = isForceMuted(participant, MEDIA_TYPE.AUDIO, state);
    const isModerator = isParticipantModerator(participant);

    if (audioModeration && !isAudioForceMuted && !isModerator) {
        conference?.avModerationReject(MEDIA_TYPE.AUDIO, id);
    }
};

/**
 * Action used by moderator to reject video for a participant.
 *
 * @param {staring} id - The id of the participant to be rejected.
 * @returns {void}
 */
export const rejectParticipantVideo = (id: string) => (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
    const state = getState();
    const { conference } = getConferenceState(state);
    const videoModeration = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    const participant = getParticipantById(state, id);
    const isVideoForceMuted = isForceMuted(participant, MEDIA_TYPE.VIDEO, state);
    const isModerator = isParticipantModerator(participant);

    if (videoModeration && !isVideoForceMuted && !isModerator) {
        conference?.avModerationReject(MEDIA_TYPE.VIDEO, id);
    }
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
 * @param {IParticipant} participant - The participant for which the notification to be hidden.
 * @returns {Object}
 */
export function dismissPendingAudioParticipant(participant: IParticipant) {
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
 * Requests disable of audio moderation.
 *
 * @returns {{
 *     type: REQUEST_DISABLE_AUDIO_MODERATION
 * }}
 */
export const requestDisableAudioModeration = () => {
    return {
        type: REQUEST_DISABLE_AUDIO_MODERATION
    };
};

/**
 * Requests disable of video moderation.
 *
 * @returns {{
 *     type: REQUEST_DISABLE_VIDEO_MODERATION
 * }}
 */
export const requestDisableVideoModeration = () => {
    return {
        type: REQUEST_DISABLE_VIDEO_MODERATION
    };
};

/**
 * Requests enable of audio moderation.
 *
 * @returns {{
 *     type: REQUEST_ENABLE_AUDIO_MODERATION
 * }}
 */
export const requestEnableAudioModeration = () => {
    return {
        type: REQUEST_ENABLE_AUDIO_MODERATION
    };
};

/**
 * Requests enable of video moderation.
 *
 * @returns {{
 *     type: REQUEST_ENABLE_VIDEO_MODERATION
 * }}
 */
export const requestEnableVideoModeration = () => {
    return {
        type: REQUEST_ENABLE_VIDEO_MODERATION
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
 * Local participant was blocked to be able to unmute audio and video.
 *
 * @param {MediaType} mediaType - The media type to disable.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_REJECTED
 * }}
 */
export const localParticipantRejected = (mediaType: MediaType) => {
    return {
        type: LOCAL_PARTICIPANT_REJECTED,
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
 * @param {IParticipant} participant - The participant for which is the notification.
 * @returns {Object}
 */
export function participantPendingAudio(participant: IParticipant) {
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

/**
 * A participant was blocked to unmute for a mediaType.
 *
 * @param {string} id - The id of the approved participant.
 * @param {MediaType} mediaType - The media type which was approved.
 * @returns {{
 *     type: PARTICIPANT_REJECTED,
 * }}
 */
export function participantRejected(id: string, mediaType: MediaType) {
    return {
        type: PARTICIPANT_REJECTED,
        id,
        mediaType
    };
}

