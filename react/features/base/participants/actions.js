/* global interfaceConfig */

import throttle from 'lodash/throttle';

import { showNotification } from '../../notifications';

import {
    DOMINANT_SPEAKER_CHANGED,
    KICK_PARTICIPANT,
    MUTE_REMOTE_PARTICIPANT,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT
} from './actionTypes';
import { MAX_DISPLAY_NAME_LENGTH } from './constants';
import { getLocalParticipant } from './functions';

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
 * Create an action for removing a participant from the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: KICK_PARTICIPANT,
 *     id: string
 * }}
 */
export function kickParticipant(id) {
    return {
        type: KICK_PARTICIPANT,
        id
    };
}

/**
 * Creates an action to signal the connection status of the local participant
 * has changed.
 *
 * @param {string} connectionStatus - The current connection status of the local
 * participant, as enumerated by the library's participantConnectionStatus
 * constants.
 * @returns {Function}
 */
export function localParticipantConnectionStatusChanged(connectionStatus) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch(participantConnectionStatusChanged(
                participant.id,
                connectionStatus));
        }
    };
}

/**
 * Action to signal that the ID of local participant has changed. It happens
 * when the local participant joins a new conference or leaves an existing
 * conference.
 *
 * @param {string} id - New ID for local participant.
 * @returns {Function}
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
 * Action to signal the role of the local participant has changed. It can happen
 * when the participant has joined a conference, even before a non-default local
 * id has been set, or after a moderator leaves.
 *
 * @param {string} role - The new role of the local participant.
 * @returns {Function}
 */
export function localParticipantRoleChanged(role) {
    return (dispatch, getState) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch(participantRoleChanged(participant.id, role));
        }
    };
}

/**
 * Create an action for muting another participant in the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: MUTE_REMOTE_PARTICIPANT,
 *     id: string
 * }}
 */
export function muteRemoteParticipant(id) {
    return {
        type: MUTE_REMOTE_PARTICIPANT,
        id
    };
}

/**
 * Action to update a participant's connection status.
 *
 * @param {string} id - Participant's ID.
 * @param {string} connectionStatus - The new connection status of the
 * participant.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         connectionStatus: string,
 *         id: string
 *     }
 * }}
 */
export function participantConnectionStatusChanged(id, connectionStatus) {
    return {
        type: PARTICIPANT_UPDATED,
        participant: {
            connectionStatus,
            id
        }
    };
}

/**
 * Action to signal that a participant's display name has changed.
 *
 * @param {string} id - The id of the participant being changed.
 * @param {string} displayName - The new display name.
 * @returns {{
 *     type: PARTICIPANT_DISPLAY_NAME_CHANGED,
 *     id: string,
 *     name: string
 * }}
 */
export function participantDisplayNameChanged(id, displayName = '') {
    // FIXME Do not use this action over participantUpdated. This action exists
    // as a a bridge for local name updates. Once other components responsible
    // for updating the local user's display name are in react/redux, this
    // action should be replaceable with the participantUpdated action.
    return {
        type: PARTICIPANT_DISPLAY_NAME_CHANGED,
        id,
        name: displayName.substr(0, MAX_DISPLAY_NAME_LENGTH)
    };
}

/**
 * Action to signal that a participant has joined.
 *
 * @param {Participant} participant - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }}
 */
export function participantJoined(participant) {
    if (!participant.local && !participant.conference) {
        throw Error(
            'A remote participant must be associated with a JitsiConference!');
    }

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
 * Action to signal that a participant's presence status has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {string} presence - Participant's new presence status.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         presence: string
 *     }
 * }}
 */
export function participantPresenceChanged(id, presence) {
    return participantUpdated({
        id,
        presence
    });
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
    return participantUpdated({
        id,
        role
    });
}

/**
 * Action to signal that some of participant properties has been changed.
 *
 * @param {Participant} participant={} - Information about participant. To
 * identify the participant the object should contain either property id with
 * value the id of the participant or property local with value true (if the
 * local participant hasn't joined the conference yet).
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: Participant
 * }}
 */
export function participantUpdated(participant = {}) {
    return {
        type: PARTICIPANT_UPDATED,
        participant
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

/**
 * An array of names of participants that have joined the conference. The array
 * is replaced with an empty array as notifications are displayed.
 *
 * @private
 * @type {string[]}
 */
let joinedParticipantsNames = [];

/**
 * A throttled internal function that takes the internal list of participant
 * names, {@code joinedParticipantsNames}, and triggers the display of a
 * notification informing of their joining.
 *
 * @private
 * @type {Function}
 */
const _throttledNotifyParticipantConnected = throttle(dispatch => {
    const joinedParticipantsCount = joinedParticipantsNames.length;

    let notificationProps;

    if (joinedParticipantsCount >= 3) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0],
                count: joinedParticipantsCount - 1
            },
            titleKey: 'notify.connectedThreePlusMembers'
        };
    } else if (joinedParticipantsCount === 2) {
        notificationProps = {
            titleArguments: {
                first: joinedParticipantsNames[0],
                second: joinedParticipantsNames[1]
            },
            titleKey: 'notify.connectedTwoMembers'
        };
    } else if (joinedParticipantsCount) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0]
            },
            titleKey: 'notify.connectedOneMember'
        };
    }

    if (notificationProps) {
        dispatch(
            showNotification(notificationProps, 2500));
    }

    joinedParticipantsNames = [];

}, 500, { leading: false });

/**
 * Queues the display of a notification of a participant having connected to
 * the meeting. The notifications are batched so that quick consecutive
 * connection events are shown in one notification.
 *
 * @param {string} displayName - The name of the participant that connected.
 * @returns {Function}
 */
export function showParticipantJoinedNotification(displayName) {
    joinedParticipantsNames.push(
        displayName || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);

    return dispatch => _throttledNotifyParticipantConnected(dispatch);
}
