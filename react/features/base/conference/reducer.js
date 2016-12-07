import { ReducerRegistry, setStateProperty } from '../redux';

import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_LEAVE,
    SET_ROOM
} from './actionTypes';
import { isRoomValid } from './functions';

const INITIAL_STATE = {
    jitsiConference: null,

    /**
     * Instance of JitsiConference that is currently in 'leaving' state.
     */
    leavingJitsiConference: null,

    /**
     * The name of the room of the conference (to be) joined (i.e.
     * {@link #jitsiConference}).
     *
     * @type {string}
     */
    room: null
};

/**
 * Listen for actions that contain the conference object, so that it can be
 * stored for use by other action creators.
 */
ReducerRegistry.register('features/base/conference',
    (state = INITIAL_STATE, action) => {
        switch (action.type) {
        case CONFERENCE_JOINED:
            return (
                setStateProperty(
                        state,
                        'jitsiConference',
                        action.conference.jitsiConference));

        case CONFERENCE_LEFT:
            if (state.jitsiConference === action.conference.jitsiConference) {
                return {
                    ...state,
                    jitsiConference: null,
                    leavingJitsiConference: state.leavingJitsiConference
                        === action.conference.jitsiConference
                            ? null
                            : state.leavingJitsiConference
                };
            }
            break;

        case CONFERENCE_WILL_LEAVE:
            return (
                setStateProperty(
                        state,
                        'leavingJitsiConference',
                        action.conference.jitsiConference));

        case SET_ROOM:
            return _setRoom(state, action);
        }

        return state;
    });

/**
 * Reduces a specific Redux action SET_ROOM of the feature base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action SET_ROOM to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _setRoom(state, action) {
    let room = action.room;

    if (isRoomValid(room)) {
        // XXX Lib-jitsi-meet does not accept uppercase letters.
        room = room.toLowerCase();
    } else {
        // Technically, there are multiple values which don't represent valid
        // room names. Practically, each of them is as bad as the rest of them
        // because we can't use any of them to join a conference.
        room = INITIAL_STATE.room;
    }

    return setStateProperty(state, 'room', room);
}
