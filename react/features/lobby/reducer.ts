import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    SET_PASSWORD
} from '../base/conference/actionTypes';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED,
    KNOCKING_PARTICIPANT_LEFT,
    REMOVE_LOBBY_CHAT_WITH_MODERATOR,
    SET_KNOCKING_STATE,
    SET_LOBBY_MODE_ENABLED,
    SET_LOBBY_PARTICIPANT_CHAT_STATE,
    SET_LOBBY_VISIBILITY,
    SET_PASSWORD_JOIN_FAILED
} from './actionTypes';
import { IKnockingParticipant } from './types';

const DEFAULT_STATE = {
    isDisplayNameRequiredError: false,
    knocking: false,
    knockingParticipants: [],
    lobbyEnabled: false,
    lobbyVisible: false,
    passwordJoinFailed: false
};

export interface ILobbyState {

    /**
     * A conference error when we tried to join into a room with no display name
     * when lobby is enabled in the room.
     */
    isDisplayNameRequiredError: boolean;
    knocking: boolean;
    knockingParticipants: IKnockingParticipant[];
    lobbyEnabled: boolean;
    lobbyVisible: boolean;
    passwordJoinFailed: boolean;
}

/**
 * Reduces redux actions which affect the display of notifications.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register<ILobbyState>('features/lobby', (state = DEFAULT_STATE, action): ILobbyState => {
    switch (action.type) {
    case CONFERENCE_FAILED: {
        if (action.error.name === JitsiConferenceErrors.DISPLAY_NAME_REQUIRED) {
            return {
                ...state,
                isDisplayNameRequiredError: true
            };
        }

        return state;
    }
    case CONFERENCE_JOINED:
    case CONFERENCE_LEFT:
        return {
            ...state,
            knocking: false,
            passwordJoinFailed: false
        };
    case KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED:
        return _knockingParticipantArrivedOrUpdated(action.participant, state);
    case KNOCKING_PARTICIPANT_LEFT:
        return {
            ...state,
            knockingParticipants: state.knockingParticipants.filter(p => p.id !== action.id)
        };
    case SET_KNOCKING_STATE:
        return {
            ...state,
            knocking: action.knocking,
            passwordJoinFailed: false
        };
    case SET_LOBBY_MODE_ENABLED:
        return {
            ...state,
            lobbyEnabled: action.enabled
        };
    case SET_LOBBY_VISIBILITY:
        return {
            ...state,
            lobbyVisible: action.visible
        };
    case SET_PASSWORD:
        return {
            ...state,
            passwordJoinFailed: false
        };
    case SET_PASSWORD_JOIN_FAILED:
        return {
            ...state,
            passwordJoinFailed: action.failed
        };
    case SET_LOBBY_PARTICIPANT_CHAT_STATE:
        return {
            ...state,
            knockingParticipants: state.knockingParticipants.map(participant => {
                if (participant.id === action.participant.id) {
                    return {
                        ...participant,
                        chattingWithModerator: action.moderator.id
                    };
                }

                return participant;
            })
        };
    case REMOVE_LOBBY_CHAT_WITH_MODERATOR:
        return {
            ...state,
            knockingParticipants: state.knockingParticipants.map(participant => {
                if (participant.chattingWithModerator === action.moderatorId) {
                    return {
                        ...participant,
                        chattingWithModerator: undefined
                    };
                }

                return participant;
            })
        };
    }

    return state;
});

/**
 * Stores or updates a knocking participant.
 *
 * @param {Object} participant - The arrived or updated knocking participant.
 * @param {Object} state - The current Redux state of the feature.
 * @returns {Object}
 */
function _knockingParticipantArrivedOrUpdated(participant: IKnockingParticipant, state: ILobbyState) {
    let existingParticipant = state.knockingParticipants.find(p => p.id === participant.id);

    existingParticipant = {
        ...existingParticipant,
        ...participant
    };

    return {
        ...state,
        knockingParticipants: [
            ...state.knockingParticipants.filter(p => p.id !== participant.id),
            existingParticipant
        ]
    };
}
