import { LOCKED_LOCALLY, LOCKED_REMOTELY } from '../../room-lock';

import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import { assign, ReducerRegistry, set } from '../redux';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    LOCK_STATE_CHANGED,
    SET_AUDIO_ONLY,
    _SET_AUDIO_ONLY_VIDEO_MUTED,
    SET_LARGE_VIDEO_HD_STATUS,
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

    case CONFERENCE_WILL_JOIN:
        return _conferenceWillJoin(state, action);

    case CONFERENCE_WILL_LEAVE:
        return _conferenceWillLeave(state, action);

    case LOCK_STATE_CHANGED:
        return _lockStateChanged(state, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(state, action);

    case _SET_AUDIO_ONLY_VIDEO_MUTED:
        return _setAudioOnlyVideoMuted(state, action);

    case SET_LARGE_VIDEO_HD_STATUS:
        return _setLargeVideoHDStatus(state, action);

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
function _conferenceFailed(state, { conference, error }) {
    if (state.conference && state.conference !== conference) {
        return state;
    }

    const passwordRequired
        = JitsiConferenceErrors.PASSWORD_REQUIRED === error
            ? conference
            : undefined;

    return assign(state, {
        audioOnly: undefined,
        audioOnlyVideoMuted: undefined,
        conference: undefined,
        joining: undefined,
        leaving: undefined,

        /**
         * The indicator of how the conference/room is locked. If falsy, the
         * conference/room is unlocked; otherwise, it's either
         * {@code LOCKED_LOCALLY} or {@code LOCKED_REMOTELY}.
         *
         * @type {string}
         */
        locked: passwordRequired ? LOCKED_REMOTELY : undefined,
        password: undefined,

        /**
         * The JitsiConference instance which requires a password to join.
         *
         * @type {JitsiConference}
         */
        passwordRequired
    });
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
function _conferenceJoined(state, { conference }) {
    // FIXME The indicator which determines whether a JitsiConference is locked
    // i.e. password-protected is private to lib-jitsi-meet. However, the
    // library does not fire LOCK_STATE_CHANGED upon joining a JitsiConference
    // with a password.
    const locked = conference.room.locked ? LOCKED_REMOTELY : undefined;

    return assign(state, {
        /**
         * The JitsiConference instance represented by the Redux state of the
         * feature base/conference.
         *
         * @type {JitsiConference}
         */
        conference,
        joining: undefined,
        leaving: undefined,

        /**
         * The indicator which determines whether the conference is locked.
         *
         * @type {boolean}
         */
        locked,
        passwordRequired: undefined
    });
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
function _conferenceLeft(state, { conference }) {
    if (state.conference !== conference) {
        return state;
    }

    return assign(state, {
        audioOnly: undefined,
        audioOnlyVideoMuted: undefined,
        conference: undefined,
        joining: undefined,
        leaving: undefined,
        locked: undefined,
        password: undefined,
        passwordRequired: undefined
    });
}

/**
 * Reduces a specific Redux action CONFERENCE_WILL_JOIN of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action CONFERENCE_WILL_JOIN to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceWillJoin(state, { conference }) {
    return set(state, 'joining', conference);
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
function _conferenceWillLeave(state, { conference }) {
    if (state.conference !== conference) {
        return state;
    }

    return assign(state, {
        joining: undefined,

        /**
         * The JitsiConference instance which is currently in the process of
         * being left.
         *
         * @type {JitsiConference}
         */
        leaving: conference,
        passwordRequired: undefined
    });
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
function _lockStateChanged(state, { conference, locked }) {
    if (state.conference !== conference) {
        return state;
    }

    return assign(state, {
        locked: locked ? state.locked || LOCKED_REMOTELY : undefined,
        password: locked ? state.password : undefined
    });
}

/**
 * Reduces a specific Redux action SET_AUDIO_ONLY of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action SET_AUDIO_ONLY to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _setAudioOnly(state, action) {
    return set(state, 'audioOnly', action.audioOnly);
}

/**
 * Reduces a specific Redux action _SET_AUDIO_ONLY_VIDEO_MUTED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action SET_AUDIO_ONLY_VIDEO_MUTED to
 * reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _setAudioOnlyVideoMuted(state, action) {
    return set(state, 'audioOnlyVideoMuted', action.muted);
}

/**
 * Reduces a specific Redux action SET_LARGE_VIDEO_HD_STATUS of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action SET_LARGE_VIDEO_HD_STATUS to
 * reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _setLargeVideoHDStatus(state, action) {
    return set(state, 'isLargeVideoHD', action.isLargeVideoHD);
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
function _setPassword(state, { conference, method, password }) {
    switch (method) {
    case conference.join:
        if (state.passwordRequired === conference) {
            return assign(state, {
                locked: LOCKED_REMOTELY,

                /**
                 * The password with which the conference is to be joined.
                 *
                 * @type {string}
                 */
                password,
                passwordRequired: undefined
            });
        }
        break;

    case conference.lock:
        return assign(state, {
            locked: password ? LOCKED_LOCALLY : undefined,
            password
        });
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

    if (!isRoomValid(room)) {
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
    return set(state, 'room', room);
}
