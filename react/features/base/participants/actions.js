import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT
} from './actionTypes';
import { getLocalParticipant } from './functions';

/**
 * Action to update a participant's avatar ID.
 *
 * @param {string} id - Participant's ID.
 * @param {string} avatarID - Participant's avatar ID.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         avatarID: string,
 *     }
 * }}
 */
export function changeParticipantAvatarID(id, avatarID) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            id,
            avatarID
        }
    };
}

/**
 * Action to update a participant's avatar URL.
 *
 * @param {string} id - Participant's ID.
 * @param {string} avatarURL - Participant's avatar URL.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         avatarURL: string,
 *     }
 * }}
 */
export function changeParticipantAvatarURL(id, avatarURL) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            id,
            avatarURL
        }
    };
}

/**
 * Action to update a participant's email.
 *
 * @param {string} id - Participant's ID.
 * @param {string} email - Participant's email.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         email: string
 *     }
 * }}
 */
export function changeParticipantEmail(id, email) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            id,
            email
        }
    };
}

/**
 * Create an action for when dominant speaker changes.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         id: string
 *     }
 * }}
 */
export function dominantSpeakerChanged(id) {
    return {
        type: DOMINANT_SPEAKER_CHANGED,
        participant: {
            id
        }
    };
}

/**
 * Action to signal that ID of local participant has changed. This happens when
 * local participant joins a new conference or quits one.
 *
 * @param {string} id - New ID for local participant.
 * @returns {{
 *     type: PARTICIPANT_ID_CHANGED,
 *     newValue: string,
 *     oldValue: string
 * }}
 */
export function localParticipantIdChanged(id) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch({
                type: PARTICIPANT_ID_CHANGED,
                newValue: id,
                oldValue: participant.id
            });
        }
    };
}

/**
 * Action to signal that a local participant has joined.
 *
 * @param {Participant} participant={} - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }}
 */
export function localParticipantJoined(participant = {}) {
    return participantJoined({
        ...participant,
        local: true
    });
}

/**
 * Action to remove a local participant.
 *
 * @returns {Function}
 */
export function localParticipantLeft() {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch(participantLeft(participant.id));
        }
    };
}

/**
 * Action to signal that a participant has joined.
 *
 * @param {Participant} participant - Information about participant.
 * @returns {{
 *      type: PARTICIPANT_JOINED,
 *      participant: Participant
 * }}
 */
export function participantJoined(participant) {
    return {
        type: PARTICIPANT_JOINED,
        participant
    };
}

/**
 * Action to signal that a participant has left.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         id: string
 *     }
 * }}
 */
export function participantLeft(id) {
    return {
        type: PARTICIPANT_LEFT,
        participant: {
            id
        }
    };
}

/**
 * Action to signal that a participant's role has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {PARTICIPANT_ROLE} role - Participant's new role.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         role: PARTICIPANT_ROLE
 *     }
 * }}
 */
export function participantRoleChanged(id, role) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            id,
            role
        }
    };
}

/**
 * Create an action which pins a conference participant.
 *
 * @param {string|null} id - The ID of the conference participant to pin or null
 * if none of the conference's participants are to be pinned.
 * @returns {{
 *     type: PIN_PARTICIPANT,
 *     participant: {
 *         id: string
 *     }
 * }}
 */
export function pinParticipant(id) {
    return {
        type: PIN_PARTICIPANT,
        participant: {
            id
        }
    };
}
