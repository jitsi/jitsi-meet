// @flow

import { ReducerRegistry, set } from '../redux';
import { randomHexString } from '../util';

import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT
} from './actionTypes';
import { LOCAL_PARTICIPANT_DEFAULT_ID, PARTICIPANT_ROLE } from './constants';

/**
 * Participant object.
 * @typedef {Object} Participant
 * @property {string} id - Participant ID.
 * @property {string} name - Participant name.
 * @property {string} avatar - Path to participant avatar if any.
 * @property {string} role - Participant role.
 * @property {boolean} local - If true, participant is local.
 * @property {boolean} pinned - If true, participant is currently a
 * "PINNED_ENDPOINT".
 * @property {boolean} dominantSpeaker - If this participant is the dominant
 * speaker in the (associated) conference, {@code true}; otherwise,
 * {@code false}.
 * @property {string} email - Participant email.
 */

declare var APP: Object;

/**
 * The participant properties which cannot be updated through
 * {@link PARTICIPANT_UPDATED}. They either identify the participant or can only
 * be modified through property-dedicated actions.
 *
 * @type {string[]}
 */
const PARTICIPANT_PROPS_TO_OMIT_WHEN_UPDATE = [

    // The following properties identify the participant:
    'conference',
    'id',
    'local',

    // The following properties can only be modified through property-dedicated
    // actions:
    'dominantSpeaker',
    'pinned'
];

/**
 * Listen for actions which add, remove, or update the set of participants in
 * the conference.
 *
 * @param {Participant[]} state - List of participants to be modified.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Participant} action.participant - Information about participant to be
 * added/removed/modified.
 * @returns {Participant[]}
 */
ReducerRegistry.register('features/base/participants', (state = [], action) => {
    switch (action.type) {
    case DOMINANT_SPEAKER_CHANGED:
    case PARTICIPANT_ID_CHANGED:
    case PARTICIPANT_UPDATED:
    case PIN_PARTICIPANT:
        return state.map(p => _participant(p, action));

    case PARTICIPANT_JOINED:
        return [ ...state, _participantJoined(action) ];

    case PARTICIPANT_LEFT: {
        // XXX A remote participant is uniquely identified by their id in a
        // specific JitsiConference instance. The local participant is uniquely
        // identified by the very fact that there is only one local participant
        // (and the fact that the local participant "joins" at the beginning of
        // the app and "leaves" at the end of the app).
        const { conference, id } = action.participant;

        return state.filter(p =>
            !(
                p.id === id
                    && (p.local
                        || (conference && p.conference === conference))));
    }
    }

    return state;
});

/**
 * Reducer function for a single participant.
 *
 * @param {Participant|undefined} state - Participant to be modified.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Participant} action.participant - Information about participant to be
 * added/modified.
 * @param {JitsiConference} action.conference - Conference instance.
 * @private
 * @returns {Participant}
 */
function _participant(state: Object = {}, action) {
    switch (action.type) {
    case DOMINANT_SPEAKER_CHANGED:
        // Only one dominant speaker is allowed.
        return (
            set(state, 'dominantSpeaker', state.id === action.participant.id));

    case PARTICIPANT_ID_CHANGED:
        if (state.id === action.oldValue) {
            return {
                ...state,
                id: action.newValue
            };
        }
        break;

    case PARTICIPANT_UPDATED: {
        const { participant } = action; // eslint-disable-line no-shadow
        let { id } = participant;
        const { local } = participant;

        if (!id && local) {
            id = LOCAL_PARTICIPANT_DEFAULT_ID;
        }

        if (state.id === id) {
            const newState = { ...state };

            for (const key in participant) {
                if (participant.hasOwnProperty(key)
                        && PARTICIPANT_PROPS_TO_OMIT_WHEN_UPDATE.indexOf(key)
                            === -1) {
                    newState[key] = participant[key];
                }
            }

            return newState;
        }
        break;
    }

    case PIN_PARTICIPANT:
        // Currently, only one pinned participant is allowed.
        return set(state, 'pinned', state.id === action.participant.id);
    }

    return state;
}

/**
 * Reduces a specific redux action of type {@link PARTICIPANT_JOINED} in the
 * feature base/participants.
 *
 * @param {Action} action - The redux action of type {@code PARTICIPANT_JOINED}
 * to reduce.
 * @private
 * @returns {Object} The new participant derived from the payload of the
 * specified {@code action} to be added into the redux state of the feature
 * base/participants after the reduction of the specified
 * {@code action}.
 */
function _participantJoined({ participant }) {
    const {
        avatarURL,
        connectionStatus,
        dominantSpeaker,
        email,
        isBot,
        local,
        name,
        pinned,
        presence,
        role
    } = participant;
    let { avatarID, conference, id } = participant;

    if (local) {
        // avatarID
        //
        // TODO Get the avatarID of the local participant from localStorage.
        avatarID || (avatarID = randomHexString(32));

        // conference
        //
        // XXX The local participant is not identified in association with a
        // JitsiConference because it is identified by the very fact that it is
        // the local participant.
        conference = undefined;

        // id
        id || (id = LOCAL_PARTICIPANT_DEFAULT_ID);
    }

    return {
        avatarID,
        avatarURL,
        conference,
        connectionStatus,
        dominantSpeaker: dominantSpeaker || false,
        email,
        id,
        isBot,
        local: local || false,
        name,
        pinned: pinned || false,
        presence,
        role: role || PARTICIPANT_ROLE.NONE
    };
}
