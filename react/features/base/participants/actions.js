/* global interfaceConfig */

import throttle from 'lodash/throttle';

import { set } from '../redux';
import { showNotification } from '../../notifications';

import {
    DOMINANT_SPEAKER_CHANGED,
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    KICK_PARTICIPANT,
    MUTE_REMOTE_PARTICIPANT,
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
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @returns {{
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string
 *     }
 * }}
 */
export function dominantSpeakerChanged(id, conference) {
    return {
        type: DOMINANT_SPEAKER_CHANGED,
        participant: {
            conference,
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

                // XXX A participant is identified by an id-conference pair.
                // Only the local participant is with an undefined conference.
                conference: undefined,
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
    return participantJoined(set(participant, 'local', true));
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
            return (
                dispatch(
                    participantLeft(
                        participant.id,

                        // XXX Only the local participant is allowed to leave
                        // without stating the JitsiConference instance because
                        // the local participant is uniquely identified by the
                        // very fact that there is only one local participant
                        // (and the fact that the local participant "joins" at
                        // the beginning of the app and "leaves" at the end of
                        // the app).
                        undefined)));
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
 * Action to signal that a participant has joined.
 *
 * @param {Participant} participant - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }}
 */
export function participantJoined(participant) {
    // Only the local participant is not identified with an id-conference pair.
    if (participant.local) {
        return {
            type: PARTICIPANT_JOINED,
            participant
        };
    }

    // In other words, a remote participant is identified with an id-conference
    // pair.
    const { conference } = participant;

    if (!conference) {
        throw Error(
            'A remote participant must be associated with a JitsiConference!');
    }

    return (dispatch, getState) => {
        // A remote participant is only expected to join in a joined or joining
        // conference. The following check is really necessary because a
        // JitsiConference may have moved into leaving but may still manage to
        // sneak a PARTICIPANT_JOINED in if its leave is delayed for any purpose
        // (which is not outragous given that leaving involves network
        // requests.)
        const stateFeaturesBaseConference
            = getState()['features/base/conference'];

        if (conference === stateFeaturesBaseConference.conference
                || conference === stateFeaturesBaseConference.joining) {
            return dispatch({
                type: PARTICIPANT_JOINED,
                participant
            });
        }
    };
}

/**
 * Action to signal that a hidden participant has joined the conference.
 *
 * @param {string} id - The id of the participant.
 * @param {string} displayName - The display name, or undefined when
 * unknown.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_JOINED,
 *     displayName: string,
 *     id: string
 * }}
 */
export function hiddenParticipantJoined(id, displayName) {
    return {
        type: HIDDEN_PARTICIPANT_JOINED,
        id,
        displayName
    };
}

/**
 * Action to signal that a hidden participant has left the conference.
 *
 * @param {string} id - The id of the participant.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_LEFT,
 *     id: string
 * }}
 */
export function hiddenParticipantLeft(id) {
    return {
        type: HIDDEN_PARTICIPANT_LEFT,
        id
    };
}

/**
 * Action to signal that a participant has left.
 *
 * @param {string} id - Participant's ID.
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @returns {{
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string
 *     }
 * }}
 */
export function participantLeft(id, conference) {
    return {
        type: PARTICIPANT_LEFT,
        participant: {
            conference,
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
    if (participant.name) {
        participant.name = participant.name.substr(0, MAX_DISPLAY_NAME_LENGTH);
    }

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
