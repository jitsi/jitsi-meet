import { JitsiConferenceEvents } from '../lib-jitsi-meet';
import { setVideoMuted } from '../media';
import {
    dominantSpeakerChanged,
    getLocalParticipant,
    participantConnectionStatusChanged,
    participantJoined,
    participantLeft,
    participantRoleChanged,
    participantUpdated
} from '../participants';
import { trackAdded, trackRemoved } from '../tracks';

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
    SET_LASTN,
    SET_PASSWORD,
    SET_PASSWORD_FAILED,
    SET_ROOM
} from './actionTypes';
import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND
} from './constants';
import { _addLocalTracksToConference } from './functions';

import type { Dispatch } from 'redux';

/**
 * Adds conference (event) listeners.
 *
 * @param {JitsiConference} conference - The JitsiConference instance.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @private
 * @returns {void}
 */
function _addConferenceListeners(conference, dispatch) {
    // Dispatches into features/base/conference follow:

    conference.on(
            JitsiConferenceEvents.CONFERENCE_FAILED,
            (...args) => dispatch(conferenceFailed(conference, ...args)));
    conference.on(
            JitsiConferenceEvents.CONFERENCE_JOINED,
            (...args) => dispatch(conferenceJoined(conference, ...args)));
    conference.on(
            JitsiConferenceEvents.CONFERENCE_LEFT,
            (...args) => dispatch(conferenceLeft(conference, ...args)));

    conference.on(
            JitsiConferenceEvents.LOCK_STATE_CHANGED,
            (...args) => dispatch(lockStateChanged(conference, ...args)));

    // Dispatches into features/base/tracks follow:

    conference.on(
            JitsiConferenceEvents.TRACK_ADDED,
            t => t && !t.isLocal() && dispatch(trackAdded(t)));
    conference.on(
            JitsiConferenceEvents.TRACK_REMOVED,
            t => t && !t.isLocal() && dispatch(trackRemoved(t)));

    // Dispatches into features/base/participants follow:

    conference.on(
            JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
            (...args) => dispatch(dominantSpeakerChanged(...args)));

    conference.on(
            JitsiConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
            (...args) => dispatch(participantConnectionStatusChanged(...args)));

    conference.on(
            JitsiConferenceEvents.USER_JOINED,
            (id, user) => dispatch(participantJoined({
                id,
                name: user.getDisplayName(),
                role: user.getRole()
            })));
    conference.on(
            JitsiConferenceEvents.USER_LEFT,
            (...args) => dispatch(participantLeft(...args)));
    conference.on(
            JitsiConferenceEvents.USER_ROLE_CHANGED,
            (...args) => dispatch(participantRoleChanged(...args)));

    conference.addCommandListener(
            AVATAR_ID_COMMAND,
            (data, id) => dispatch(participantUpdated({
                id,
                avatarID: data.value
            })));
    conference.addCommandListener(
            AVATAR_URL_COMMAND,
            (data, id) => dispatch(participantUpdated({
                id,
                avatarURL: data.value
            })));
    conference.addCommandListener(
            EMAIL_COMMAND,
            (data, id) => dispatch(participantUpdated({
                id,
                email: data.value
            })));
}

/**
 * Sets the data for the local participant to the conference.
 *
 * @param {JitsiConference} conference - The JitsiConference instance.
 * @param {Object} state - The Redux state.
 * @returns {void}
 */
function _setLocalParticipantData(conference, state) {
    const { avatarID } = getLocalParticipant(state);

    conference.removeCommand(AVATAR_ID_COMMAND);
    conference.sendCommand(AVATAR_ID_COMMAND, {
        value: avatarID
    });
}

/**
 * Signals that a specific conference has failed.
 *
 * @param {JitsiConference} conference - The JitsiConference that has failed.
 * @param {string} error - The error describing/detailing the cause of the
 * failure.
 * @returns {{
 *     type: CONFERENCE_FAILED,
 *     conference: JitsiConference,
 *     error: string
 * }}
 * @public
 */
export function conferenceFailed(conference, error) {
    return {
        type: CONFERENCE_FAILED,
        conference,
        error
    };
}

/**
 * Attach any pre-existing local media to the conference once the conference has
 * been joined.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which was
 * joined by the local participant.
 * @returns {Function}
 */
export function conferenceJoined(conference) {
    return (dispatch, getState) => {
        const localTracks
            = getState()['features/base/tracks']
                .filter(t => t.local)
                .map(t => t.jitsiTrack);

        if (localTracks.length) {
            _addLocalTracksToConference(conference, localTracks);
        }

        dispatch({
            type: CONFERENCE_JOINED,
            conference
        });
    };
}

/**
 * Signals that a specific conference has been left.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which was
 * left by the local participant.
 * @returns {{
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference
 * }}
 */
export function conferenceLeft(conference) {
    return {
        type: CONFERENCE_LEFT,
        conference
    };
}

/**
 * Signals the intention of the application to have the local participant join a
 * conference with a specific room (name). Similar in fashion
 * to CONFERENCE_JOINED.
 *
 * @param {string} room - The room (name) which identifies the conference the
 * local participant will (try to) join.
 * @returns {{
 *     type: CONFERENCE_WILL_JOIN,
 *     room: string
 * }}
 */
function _conferenceWillJoin(room) {
    return {
        type: CONFERENCE_WILL_JOIN,
        room
    };
}

/**
 * Signals the intention of the application to have the local participant leave
 * a specific conference. Similar in fashion to CONFERENCE_LEFT. Contrary to it
 * though, it's not guaranteed because CONFERENCE_LEFT may be triggered by
 * lib-jitsi-meet and not the application.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which will
 * be left by the local participant.
 * @returns {{
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference
 * }}
 */
export function conferenceWillLeave(conference) {
    return {
        type: CONFERENCE_WILL_LEAVE,
        conference
    };
}

/**
 * Initializes a new conference.
 *
 * @returns {Function}
 */
export function createConference() {
    return (dispatch, getState) => {
        const state = getState();
        const connection = state['features/base/connection'].connection;

        if (!connection) {
            throw new Error('Cannot create conference without connection');
        }

        const { password, room } = state['features/base/conference'];

        if (typeof room === 'undefined' || room === '') {
            throw new Error('Cannot join conference without room name');
        }

        dispatch(_conferenceWillJoin(room));

        const config = state['features/base/config'];
        const conference
            = connection.initJitsiConference(

                // XXX Lib-jitsi-meet does not accept uppercase letters.
                room.toLowerCase(),
                {
                    ...config,

                    openSctp: true

                    // FIXME I tested H.264 from iPhone 6S during a morning
                    // standup but, unfortunately, the other participants who
                    // happened to be running the Web app saw only black.
                    //
                    // preferH264: true
                });

        _addConferenceListeners(conference, dispatch);

        _setLocalParticipantData(conference, state);

        conference.join(password);
    };
}

/**
 * Signals that the lock state of a specific JitsiConference changed.
 *
 * @param {JitsiConference} conference - The JitsiConference which had its lock
 * state changed.
 * @param {boolean} locked - If the specified conference became locked, true;
 * otherwise, false.
 * @returns {{
 *     type: LOCK_STATE_CHANGED,
 *     conference: JitsiConference,
 *     locked: boolean
 * }}
 */
export function lockStateChanged(conference, locked) {
    return {
        type: LOCK_STATE_CHANGED,
        conference,
        locked
    };
}

/**
 * Sets the audio-only flag for the current JitsiConference.
 *
 * @param {boolean} audioOnly - True if the conference should be audio only;
 * false, otherwise.
 * @private
 * @returns {{
 *     type: SET_AUDIO_ONLY,
 *     audioOnly: boolean
 * }}
 */
function _setAudioOnly(audioOnly) {
    return {
        type: SET_AUDIO_ONLY,
        audioOnly
    };
}

/**
 * Signals that the app should mute video because it's now in audio-only mode,
 * or unmute it because it no longer is. If video was already muted, nothing
 * will happen; otherwise, it will be muted. When audio-only mode is disabled,
 * the previous state will be restored.
 *
 * @param {boolean} muted - True if video should be muted; false, otherwise.
 * @protected
 * @returns {Function}
 */
export function _setAudioOnlyVideoMuted(muted: boolean) {
    return (dispatch, getState) => {
        if (muted) {
            const { video } = getState()['features/base/media'];

            if (video.muted) {
                // Video is already muted, do nothing.
                return;
            }
        } else {
            const { audioOnlyVideoMuted }
                = getState()['features/base/conference'];

            if (!audioOnlyVideoMuted) {
                // We didn't mute video, do nothing.
                return;
            }
        }

        // Remember that local video was muted due to the audio-only mode
        // vs user's choice.
        dispatch({
            type: _SET_AUDIO_ONLY_VIDEO_MUTED,
            muted
        });
        dispatch(setVideoMuted(muted));
    };
}

/**
 * Action to set whether or not the currently displayed large video is in
 * high-definition.
 *
 * @param {boolean} isLargeVideoHD - True if the large video is high-definition.
 * @returns {{
 *     type: SET_LARGE_VIDEO_HD_STATUS,
 *     isLargeVideoHD: boolean
 * }}
 */
export function setLargeVideoHDStatus(isLargeVideoHD) {
    return {
        type: SET_LARGE_VIDEO_HD_STATUS,
        isLargeVideoHD
    };
}

/**
 * Sets the video channel's last N (value) of the current conference. A value of
 * undefined shall be used to reset it to the default value.
 *
 * @param {(number|undefined)} lastN - The last N value to be set.
 * @returns {Function}
 */
export function setLastN(lastN: ?number) {
    return (dispatch: Dispatch<*>, getState: Function) => {
        if (typeof lastN === 'undefined') {
            const config = getState()['features/base/config'];

            /* eslint-disable no-param-reassign */

            lastN = config.channelLastN;
            if (typeof lastN === 'undefined') {
                lastN = -1;
            }

            /* eslint-enable no-param-reassign */
        }

        dispatch({
            type: SET_LASTN,
            lastN
        });
    };
}

/**
 * Sets the password to join or lock a specific JitsiConference.
 *
 * @param {JitsiConference} conference - The JitsiConference which requires a
 * password to join or is to be locked with the specified password.
 * @param {Function} method - The JitsiConference method of password protection
 * such as join or lock.
 * @param {string} password - The password with which the specified conference
 * is to be joined or locked.
 * @returns {Function}
 */
export function setPassword(conference, method, password) {
    return (dispatch, getState) => {
        switch (method) {
        case conference.join: {
            let state = getState()['features/base/conference'];

            // Make sure that the action will set a password for a conference
            // that the application wants joined.
            if (state.passwordRequired === conference) {
                dispatch({
                    type: SET_PASSWORD,
                    conference,
                    method,
                    password
                });

                // Join the conference with the newly-set password.

                // Make sure that the action did set the password.
                state = getState()['features/base/conference'];
                if (state.password === password
                        && !state.passwordRequired

                        // Make sure that the application still wants the
                        // conference joined.
                        && !state.conference) {
                    method.call(conference, password);
                }
            }
            break;
        }

        case conference.lock: {
            const state = getState()['features/base/conference'];

            if (state.conference === conference) {
                return (
                    method.call(conference, password)
                        .then(() => dispatch({
                            type: SET_PASSWORD,
                            conference,
                            method,
                            password
                        }))
                        .catch(error => dispatch({
                            type: SET_PASSWORD_FAILED,
                            error
                        }))
                );
            }

            return Promise.reject();
        }
        }
    };
}

/**
 * Sets (the name of) the room of the conference to be joined.
 *
 * @param {(string|undefined)} room - The name of the room of the conference to
 * be joined.
 * @returns {{
 *     type: SET_ROOM,
 *     room: string
 * }}
 */
export function setRoom(room) {
    return {
        type: SET_ROOM,
        room
    };
}

/**
 * Toggles the audio-only flag for the current JitsiConference.
 *
 * @returns {Function}
 */
export function toggleAudioOnly() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const { audioOnly } = getState()['features/base/conference'];

        return dispatch(_setAudioOnly(!audioOnly));
    };
}
