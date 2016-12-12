import JitsiMeetJS from '../lib-jitsi-meet';
import {
    ReducerRegistry,
    setStateProperties,
    setStateProperty
} from '../redux';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_LEAVE,
    LOCK_STATE_CHANGED,
    SET_PASSWORD,
    SET_ROOM
} from './actionTypes';
import { isRoomValid } from './functions';

/**
 * Listen for actions that contain the conference object, so that it can be
 * stored for use by other action creators.
 */
ReducerRegistry.register('features/base/conference', (state = {}, action) => {
    switch (action.type) {
    case CONFERENCE_FAILED:
        return _conferenceFailed(state, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(state, action);

    case CONFERENCE_LEFT:
        return _conferenceLeft(state, action);

    case CONFERENCE_WILL_LEAVE:
        return _conferenceWillLeave(state, action);

    case LOCK_STATE_CHANGED:
        return _lockStateChanged(state, action);

    case SET_PASSWORD:
        return _setPassword(state, action);

    case SET_ROOM:
        return _setRoom(state, action);
    }

    return state;
});

/**
 * Reduces a specific Redux action CONFERENCE_FAILED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action CONFERENCE_FAILED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceFailed(state, action) {
    const conference = action.conference;

    if (state.conference && state.conference !== conference) {
        return state;
    }

    const JitsiConferenceErrors = JitsiMeetJS.errors.conference;
    const passwordRequired
        = JitsiConferenceErrors.PASSWORD_REQUIRED === action.error
            ? conference
            : undefined;

    return (
        setStateProperties(state, {
            conference: undefined,
            leaving: undefined,
            locked: undefined,
            password: undefined,

            /**
             * The JitsiConference instance which requires a password to join.
             *
             * @type {JitsiConference}
             */
            passwordRequired
        }));
}

/**
 * Reduces a specific Redux action CONFERENCE_JOINED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action CONFERENCE_JOINED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceJoined(state, action) {
    const conference = action.conference;

    // FIXME The indicator which determines whether a JitsiConference is locked
    // i.e. password-protected is private to lib-jitsi-meet. However, the
    // library does not fire LOCK_STATE_CHANGED upon joining a JitsiConference
    // with a password.
    const locked = conference.room.locked || undefined;

    return (
        setStateProperties(state, {
            /**
             * The JitsiConference instance represented by the Redux state of
             * the feature base/conference.
             *
             * @type {JitsiConference}
             */
            conference,
            leaving: undefined,

            /**
             * The indicator which determines whether the conference is locked.
             *
             * @type {boolean}
             */
            locked,
            passwordRequired: undefined
        }));
}

/**
 * Reduces a specific Redux action CONFERENCE_LEFT of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action CONFERENCE_LEFT to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceLeft(state, action) {
    const conference = action.conference;

    if (state.conference !== conference) {
        return state;
    }

    return (
        setStateProperties(state, {
            conference: undefined,
            leaving: undefined,
            locked: undefined,
            password: undefined,
            passwordRequired: undefined
        }));
}

/**
 * Reduces a specific Redux action CONFERENCE_WILL_LEAVE of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action CONFERENCE_WILL_LEAVE to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceWillLeave(state, action) {
    const conference = action.conference;

    if (state.conference !== conference) {
        return state;
    }

    return (
        setStateProperties(state, {
            /**
             * The JitsiConference instance which is currently in the process of
             * being left.
             *
             * @type {JitsiConference}
             */
            leaving: conference,
            passwordRequired: undefined
        }));
}

/**
 * Reduces a specific Redux action LOCK_STATE_CHANGED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action LOCK_STATE_CHANGED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _lockStateChanged(state, action) {
    if (state.conference !== action.conference) {
        return state;
    }

    return setStateProperty(state, 'locked', action.locked || undefined);
}

/**
 * Reduces a specific Redux action SET_PASSWORD of the feature base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action SET_PASSWORD to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _setPassword(state, action) {
    const conference = action.conference;

    switch (action.method) {
    case conference.join:
        if (state.passwordRequired === conference) {
            return (
                setStateProperties(state, {
                    /**
                     * The password with which the conference is to be joined.
                     *
                     * @type {string}
                     */
                    password: action.password,
                    passwordRequired: undefined
                }));
        }
        break;
    }

    return state;
}

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
        room = undefined;
    }

    /**
     * The name of the room of the conference (to be) joined.
     *
     * @type {string}
     */
    return setStateProperty(state, 'room', room);
}
