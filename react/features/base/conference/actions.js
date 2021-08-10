// @flow

import type { Dispatch } from 'redux';

import {
    createStartMutedConfigurationEvent,
    sendAnalytics
} from '../../analytics';
import { endpointMessageReceived } from '../../subtitles';
import { getReplaceParticipant } from '../config/functions';
import { JITSI_CONNECTION_CONFERENCE_KEY } from '../connection';
import { JitsiConferenceEvents } from '../lib-jitsi-meet';
import { MEDIA_TYPE, setAudioMuted, setVideoMuted } from '../media';
import {
    dominantSpeakerChanged,
    getNormalizedDisplayName,
    participantConnectionStatusChanged,
    participantKicked,
    participantMutedUs,
    participantPresenceChanged,
    participantRoleChanged,
    participantUpdated
} from '../participants';
import { getLocalTracks, replaceLocalTrack, trackAdded, trackRemoved } from '../tracks';
import { getBackendSafeRoomName } from '../util';

import {
    AUTH_STATUS_CHANGED,
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_TIMESTAMP_CHANGED,
    CONFERENCE_UNIQUE_ID_SET,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    DATA_CHANNEL_OPENED,
    KICKED_OUT,
    LOCK_STATE_CHANGED,
    P2P_STATUS_CHANGED,
    SEND_TONES,
    SET_FOLLOW_ME,
    SET_PASSWORD,
    SET_PASSWORD_FAILED,
    SET_ROOM,
    SET_PENDING_SUBJECT_CHANGE,
    SET_START_MUTED_POLICY
} from './actionTypes';
import {
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    JITSI_CONFERENCE_URL_KEY
} from './constants';
import {
    _addLocalTracksToConference,
    commonUserJoinedHandling,
    commonUserLeftHandling,
    getConferenceOptions,
    getCurrentConference,
    sendLocalParticipant
} from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Adds conference (event) listeners.
 *
 * @param {JitsiConference} conference - The JitsiConference instance.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @param {Object} state - The Redux state.
 * @private
 * @returns {void}
 */
function _addConferenceListeners(conference, dispatch, state) {
    // A simple logger for conference errors received through
    // the listener. These errors are not handled now, but logged.
    conference.on(JitsiConferenceEvents.CONFERENCE_ERROR,
        error => logger.error('Conference error.', error));

    // Dispatches into features/base/conference follow:

    conference.on(
        JitsiConferenceEvents.CONFERENCE_FAILED,
        (...args) => dispatch(conferenceFailed(conference, ...args)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_JOINED,
        (...args) => dispatch(conferenceJoined(conference, ...args)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_LEFT,
        (...args) => {
            dispatch(conferenceTimestampChanged(0));
            dispatch(conferenceLeft(conference, ...args));
        });
    conference.on(JitsiConferenceEvents.SUBJECT_CHANGED,
        (...args) => dispatch(conferenceSubjectChanged(...args)));

    conference.on(JitsiConferenceEvents.CONFERENCE_CREATED_TIMESTAMP,
        (...args) => dispatch(conferenceTimestampChanged(...args)));

    conference.on(
        JitsiConferenceEvents.KICKED,
        (...args) => dispatch(kickedOut(conference, ...args)));

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_KICKED,
        (kicker, kicked) => dispatch(participantKicked(kicker, kicked)));

    conference.on(
        JitsiConferenceEvents.LOCK_STATE_CHANGED,
        (...args) => dispatch(lockStateChanged(conference, ...args)));

    // Dispatches into features/base/media follow:

    conference.on(
        JitsiConferenceEvents.STARTED_MUTED,
        () => {
            const audioMuted = Boolean(conference.isStartAudioMuted());
            const videoMuted = Boolean(conference.isStartVideoMuted());
            const localTracks = getLocalTracks(state['features/base/tracks']);

            sendAnalytics(createStartMutedConfigurationEvent('remote', audioMuted, videoMuted));
            logger.log(`Start muted: ${audioMuted ? 'audio, ' : ''}${videoMuted ? 'video' : ''}`);

            // XXX Jicofo tells lib-jitsi-meet to start with audio and/or video
            // muted i.e. Jicofo expresses an intent. Lib-jitsi-meet has turned
            // Jicofo's intent into reality by actually muting the respective
            // tracks. The reality is expressed in base/tracks already so what
            // is left is to express Jicofo's intent in base/media.
            // TODO Maybe the app needs to learn about Jicofo's intent and
            // transfer that intent to lib-jitsi-meet instead of lib-jitsi-meet
            // acting on Jicofo's intent without the app's knowledge.
            dispatch(setAudioMuted(audioMuted));
            dispatch(setVideoMuted(videoMuted));

            // Remove the tracks from peerconnection as well.
            for (const track of localTracks) {
                if ((audioMuted && track.jitsiTrack.getType() === MEDIA_TYPE.AUDIO)
                    || (videoMuted && track.jitsiTrack.getType() === MEDIA_TYPE.VIDEO)) {
                    dispatch(replaceLocalTrack(track.jitsiTrack, null, conference));
                }
            }
        });

    // Dispatches into features/base/tracks follow:

    conference.on(
        JitsiConferenceEvents.TRACK_ADDED,
        t => t && !t.isLocal() && dispatch(trackAdded(t)));
    conference.on(
        JitsiConferenceEvents.TRACK_REMOVED,
        t => t && !t.isLocal() && dispatch(trackRemoved(t)));

    conference.on(
        JitsiConferenceEvents.TRACK_MUTE_CHANGED,
        (track, participantThatMutedUs) => {
            if (participantThatMutedUs) {
                dispatch(participantMutedUs(participantThatMutedUs, track));
            }
        });

    // Dispatches into features/base/participants follow:
    conference.on(
        JitsiConferenceEvents.DISPLAY_NAME_CHANGED,
        (id, displayName) => dispatch(participantUpdated({
            conference,
            id,
            name: getNormalizedDisplayName(displayName)
        })));

    conference.on(
        JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
        id => dispatch(dominantSpeakerChanged(id, conference)));

    conference.on(
        JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
        (...args) => dispatch(endpointMessageReceived(...args)));

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
        (...args) => dispatch(participantConnectionStatusChanged(...args)));

    conference.on(
        JitsiConferenceEvents.USER_JOINED,
        (id, user) => commonUserJoinedHandling({ dispatch }, conference, user));
    conference.on(
        JitsiConferenceEvents.USER_LEFT,
        (id, user) => commonUserLeftHandling({ dispatch }, conference, user));
    conference.on(
        JitsiConferenceEvents.USER_ROLE_CHANGED,
        (...args) => dispatch(participantRoleChanged(...args)));
    conference.on(
        JitsiConferenceEvents.USER_STATUS_CHANGED,
        (...args) => dispatch(participantPresenceChanged(...args)));

    conference.on(
        JitsiConferenceEvents.BOT_TYPE_CHANGED,
        (id, botType) => dispatch(participantUpdated({
            conference,
            id,
            botType
        })));

    conference.addCommandListener(
        AVATAR_URL_COMMAND,
        (data, id) => dispatch(participantUpdated({
            conference,
            id,
            avatarURL: data.value
        })));
    conference.addCommandListener(
        EMAIL_COMMAND,
        (data, id) => dispatch(participantUpdated({
            conference,
            id,
            email: data.value
        })));
}

/**
 * Updates the current known state of server-side authentication.
 *
 * @param {boolean} authEnabled - Whether or not server authentication is
 * enabled.
 * @param {string} authLogin - The current name of the logged in user, if any.
 * @returns {{
 *     type: AUTH_STATUS_CHANGED,
 *     authEnabled: boolean,
 *     authLogin: string
 * }}
 */
export function authStatusChanged(authEnabled: boolean, authLogin: string) {
    return {
        type: AUTH_STATUS_CHANGED,
        authEnabled,
        authLogin
    };
}

/**
 * Signals that a specific conference has failed.
 *
 * @param {JitsiConference} conference - The JitsiConference that has failed.
 * @param {string} error - The error describing/detailing the cause of the
 * failure.
 * @param {any} params - Rest of the params that we receive together with the event.
 * @returns {{
 *     type: CONFERENCE_FAILED,
 *     conference: JitsiConference,
 *     error: Error
 * }}
 * @public
 */
export function conferenceFailed(conference: Object, error: string, ...params: any) {
    return {
        type: CONFERENCE_FAILED,
        conference,

        // Make the error resemble an Error instance (to the extent that
        // jitsi-meet needs it).
        error: {
            name: error,
            params,
            recoverable: undefined
        }
    };
}

/**
 * Signals that a specific conference has been joined.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which was
 * joined by the local participant.
 * @returns {{
 *     type: CONFERENCE_JOINED,
 *     conference: JitsiConference
 * }}
 */
export function conferenceJoined(conference: Object) {
    return {
        type: CONFERENCE_JOINED,
        conference
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
export function conferenceLeft(conference: Object) {
    return {
        type: CONFERENCE_LEFT,
        conference
    };
}

/**
 * Signals that the conference subject has been changed.
 *
 * @param {string} subject - The new subject.
 * @returns {{
 *     type: CONFERENCE_SUBJECT_CHANGED,
 *     subject: string
 * }}
 */
export function conferenceSubjectChanged(subject: string) {
    return {
        type: CONFERENCE_SUBJECT_CHANGED,
        subject
    };
}

/**
* Signals that the conference timestamp has been changed.
*
* @param {number} conferenceTimestamp - The UTC timestamp.
* @returns {{
*       type: CONFERENCE_TIMESTAMP_CHANGED,
*       conferenceTimestamp
* }}
*/
export function conferenceTimestampChanged(conferenceTimestamp: number) {
    return {
        type: CONFERENCE_TIMESTAMP_CHANGED,
        conferenceTimestamp
    };
}

/**
* Signals that the unique identifier for conference has been set.
*
* @param {JitsiConference} conference - The JitsiConference instance, where the uuid has been set.
* @returns {{
*   type: CONFERENCE_UNIQUE_ID_SET,
*   conference: JitsiConference,
* }}
*/
export function conferenceUniqueIdSet(conference: Object) {
    return {
        type: CONFERENCE_UNIQUE_ID_SET,
        conference
    };
}

/**
 * Adds any existing local tracks to a specific conference before the conference
 * is joined. Then signals the intention of the application to have the local
 * participant join the specified conference.
 *
 * @param {JitsiConference} conference - The {@code JitsiConference} instance
 * the local participant will (try to) join.
 * @returns {Function}
 */
function _conferenceWillJoin(conference: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const localTracks
            = getLocalTracks(getState()['features/base/tracks'])
                .map(t => t.jitsiTrack);

        if (localTracks.length) {
            _addLocalTracksToConference(conference, localTracks);
        }

        dispatch(conferenceWillJoin(conference));
    };
}

/**
 * Signals the intention of the application to have the local participant
 * join the specified conference.
 *
 * @param {JitsiConference} conference - The {@code JitsiConference} instance
 * the local participant will (try to) join.
 * @returns {{
 *     type: CONFERENCE_WILL_JOIN,
 *     conference: JitsiConference
 * }}
 */
export function conferenceWillJoin(conference: Object) {
    return {
        type: CONFERENCE_WILL_JOIN,
        conference
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
export function conferenceWillLeave(conference: Object) {
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
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { connection, locationURL } = state['features/base/connection'];

        if (!connection) {
            throw new Error('Cannot create a conference without a connection!');
        }

        const { password, room } = state['features/base/conference'];

        if (!room) {
            throw new Error('Cannot join a conference without a room name!');
        }

        const conference = connection.initJitsiConference(getBackendSafeRoomName(room), getConferenceOptions(state));

        connection[JITSI_CONNECTION_CONFERENCE_KEY] = conference;

        conference[JITSI_CONFERENCE_URL_KEY] = locationURL;

        dispatch(_conferenceWillJoin(conference));

        _addConferenceListeners(conference, dispatch, state);

        sendLocalParticipant(state, conference);

        const replaceParticipant = getReplaceParticipant(state);

        conference.join(password, replaceParticipant);
    };
}

/**
 * Will try to join the conference again in case it failed earlier with
 * {@link JitsiConferenceErrors.AUTHENTICATION_REQUIRED}. It means that Jicofo
 * did not allow to create new room from anonymous domain, but it can be tried
 * again later in case authenticated user created it in the meantime.
 *
 * @returns {Function}
 */
export function checkIfCanJoin() {
    return (dispatch: Function, getState: Function) => {
        const { authRequired, password }
            = getState()['features/base/conference'];

        const replaceParticipant = getReplaceParticipant(APP.store.getState());

        authRequired && dispatch(_conferenceWillJoin(authRequired));
        authRequired && authRequired.join(password, replaceParticipant);
    };
}

/**
 * Signals the data channel with the bridge has successfully opened.
 *
 * @returns {{
 *     type: DATA_CHANNEL_OPENED
 * }}
 */
export function dataChannelOpened() {
    return {
        type: DATA_CHANNEL_OPENED
    };
}

/**
 * Signals that we've been kicked out of the conference.
 *
 * @param {JitsiConference} conference - The {@link JitsiConference} instance
 * for which the event is being signaled.
 * @param {JitsiParticipant} participant - The {@link JitsiParticipant}
 * instance which initiated the kick event.
 * @returns {{
 *     type: KICKED_OUT,
 *     conference: JitsiConference,
 *     participant: JitsiParticipant
 * }}
 */
export function kickedOut(conference: Object, participant: Object) {
    return {
        type: KICKED_OUT,
        conference,
        participant
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
export function lockStateChanged(conference: Object, locked: boolean) {
    return {
        type: LOCK_STATE_CHANGED,
        conference,
        locked
    };
}

/**
 * Updates the known state of start muted policies.
 *
 * @param {boolean} audioMuted - Whether or not members will join the conference
 * as audio muted.
 * @param {boolean} videoMuted - Whether or not members will join the conference
 * as video muted.
 * @returns {{
 *     type: SET_START_MUTED_POLICY,
 *     startAudioMutedPolicy: boolean,
 *     startVideoMutedPolicy: boolean
 * }}
 */
export function onStartMutedPolicyChanged(
        audioMuted: boolean, videoMuted: boolean) {
    return {
        type: SET_START_MUTED_POLICY,
        startAudioMutedPolicy: audioMuted,
        startVideoMutedPolicy: videoMuted
    };
}

/**
 * Sets whether or not peer2peer is currently enabled.
 *
 * @param {boolean} p2p - Whether or not peer2peer is currently active.
 * @returns {{
 *     type: P2P_STATUS_CHANGED,
 *     p2p: boolean
 * }}
 */
export function p2pStatusChanged(p2p: boolean) {
    return {
        type: P2P_STATUS_CHANGED,
        p2p
    };
}

/**
 * Signals to play touch tones.
 *
 * @param {string} tones - The tones to play.
 * @param {number} [duration] - How long to play each tone.
 * @param {number} [pause] - How long to pause between each tone.
 * @returns {{
 *     type: SEND_TONES,
 *     tones: string,
 *     duration: number,
 *     pause: number
 * }}
 */
export function sendTones(tones: string, duration: number, pause: number) {
    return {
        type: SEND_TONES,
        tones,
        duration,
        pause
    };
}

/**
 * Enables or disables the Follow Me feature.
 *
 * @param {boolean} enabled - Whether or not Follow Me should be enabled.
 * @returns {{
 *     type: SET_FOLLOW_ME,
 *     enabled: boolean
 * }}
 */
export function setFollowMe(enabled: boolean) {
    return {
        type: SET_FOLLOW_ME,
        enabled
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
export function setPassword(
        conference: Object,
        method: Function,
        password: string) {
    return (dispatch: Dispatch<any>, getState: Function): ?Promise<void> => {
        switch (method) {
        case conference.join: {
            let state = getState()['features/base/conference'];

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

                    // Make sure that the application still wants the
                    // conference joined.
                    && !state.conference) {
                method.call(conference, password);
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
export function setRoom(room: ?string) {
    return {
        type: SET_ROOM,
        room
    };
}

/**
 * Sets whether or not members should join audio and/or video muted.
 *
 * @param {boolean} startAudioMuted - Whether or not members will join the
 * conference as audio muted.
 * @param {boolean} startVideoMuted - Whether or not members will join the
 * conference as video muted.
 * @returns {Function}
 */
export function setStartMutedPolicy(
        startAudioMuted: boolean, startVideoMuted: boolean) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const conference = getCurrentConference(getState());

        conference && conference.setStartMutedPolicy({
            audio: startAudioMuted,
            video: startVideoMuted
        });

        return dispatch(
            onStartMutedPolicyChanged(startAudioMuted, startVideoMuted));
    };
}

/**
 * Changing conference subject.
 *
 * @param {string} subject - The new subject.
 * @returns {void}
 */
export function setSubject(subject: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        if (conference) {
            conference.setSubject(subject || '');
        } else {
            dispatch({
                type: SET_PENDING_SUBJECT_CHANGE,
                subject
            });
        }
    };
}
