import { createStartMutedConfigurationEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import { transcriberJoined, transcriberLeft } from '../../transcribing/actions';
import { setIAmVisitor } from '../../visitors/actions';
import { iAmVisitor } from '../../visitors/functions';
import { overwriteConfig } from '../config/actions';
import { getReplaceParticipant } from '../config/functions';
import { connect, disconnect, hangup } from '../connection/actions';
import { JITSI_CONNECTION_CONFERENCE_KEY } from '../connection/constants';
import { hasAvailableDevices } from '../devices/functions.any';
import JitsiMeetJS, { JitsiConferenceEvents, JitsiE2ePingEvents } from '../lib-jitsi-meet';
import {
    setAudioMuted,
    setAudioUnmutePermissions,
    setVideoMuted,
    setVideoUnmutePermissions
} from '../media/actions';
import { MEDIA_TYPE, MediaType } from '../media/constants';
import {
    dominantSpeakerChanged,
    participantKicked,
    participantMutedUs,
    participantPresenceChanged,
    participantRoleChanged,
    participantSourcesUpdated,
    participantUpdated
} from '../participants/actions';
import { getNormalizedDisplayName, getParticipantByIdOrUndefined } from '../participants/functions';
import { IJitsiParticipant } from '../participants/types';
import { toState } from '../redux/functions';
import {
    destroyLocalTracks,
    replaceLocalTrack,
    trackAdded,
    trackRemoved
} from '../tracks/actions.any';
import { getLocalTracks } from '../tracks/functions';
import { getBackendSafeRoomName } from '../util/uri';

import {
    AUTH_STATUS_CHANGED,
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_JOIN_IN_PROGRESS,
    CONFERENCE_LEFT,
    CONFERENCE_LOCAL_SUBJECT_CHANGED,
    CONFERENCE_PROPERTIES_CHANGED,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_TIMESTAMP_CHANGED,
    CONFERENCE_UNIQUE_ID_SET,
    CONFERENCE_WILL_INIT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    DATA_CHANNEL_CLOSED,
    DATA_CHANNEL_OPENED,
    E2E_RTT_CHANGED,
    ENDPOINT_MESSAGE_RECEIVED,
    KICKED_OUT,
    LOCK_STATE_CHANGED,
    NON_PARTICIPANT_MESSAGE_RECEIVED,
    P2P_STATUS_CHANGED,
    SEND_TONES,
    SET_ASSUMED_BANDWIDTH_BPS,
    SET_FOLLOW_ME,
    SET_FOLLOW_ME_RECORDER,
    SET_OBFUSCATED_ROOM,
    SET_PASSWORD,
    SET_PASSWORD_FAILED,
    SET_PENDING_SUBJECT_CHANGE,
    SET_ROOM,
    SET_START_MUTED_POLICY,
    SET_START_REACTIONS_MUTED,
    UPDATE_CONFERENCE_METADATA
} from './actionTypes';
import { setupVisitorStartupMedia } from './actions';
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
    getConferenceState,
    getCurrentConference,
    getVisitorOptions,
    sendLocalParticipant
} from './functions';
import logger from './logger';
import { IConferenceMetadata, IJitsiConference } from './reducer';

/**
 * Adds conference (event) listeners.
 *
 * @param {JitsiConference} conference - The JitsiConference instance.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @param {Object} state - The Redux state.
 * @private
 * @returns {void}
 */
function _addConferenceListeners(conference: IJitsiConference, dispatch: IStore['dispatch'], state: IReduxState) {
    // A simple logger for conference errors received through
    // the listener. These errors are not handled now, but logged.
    conference.on(JitsiConferenceEvents.CONFERENCE_ERROR,
        (error: Error) => logger.error('Conference error.', error));

    // Dispatches into features/base/conference follow:

    // we want to ignore this event in case of tokenAuthUrl config
    // we are deprecating this and at some point will get rid of it
    if (!state['features/base/config'].tokenAuthUrl) {
        conference.on(
            JitsiConferenceEvents.AUTH_STATUS_CHANGED,
            (authEnabled: boolean, authLogin: string) => dispatch(authStatusChanged(authEnabled, authLogin)));
    }

    conference.on(
        JitsiConferenceEvents.CONFERENCE_FAILED,
        (err: string, ...args: any[]) => dispatch(conferenceFailed(conference, err, ...args)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_JOINED,
        (..._args: any[]) => dispatch(conferenceJoined(conference)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_UNIQUE_ID_SET,
        (..._args: any[]) => dispatch(conferenceUniqueIdSet(conference)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_JOIN_IN_PROGRESS,
        (..._args: any[]) => dispatch(conferenceJoinInProgress(conference)));
    conference.on(
        JitsiConferenceEvents.CONFERENCE_LEFT,
        (..._args: any[]) => {
            dispatch(conferenceTimestampChanged(0));
            dispatch(conferenceLeft(conference));
        });
    conference.on(JitsiConferenceEvents.SUBJECT_CHANGED,
        (subject: string) => dispatch(conferenceSubjectChanged(subject)));

    conference.on(JitsiConferenceEvents.CONFERENCE_CREATED_TIMESTAMP,
        (timestamp: number) => dispatch(conferenceTimestampChanged(timestamp)));

    conference.on(
        JitsiConferenceEvents.KICKED,
        (participant: any) => dispatch(kickedOut(conference, participant)));

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_KICKED,
        (kicker: any, kicked: any) => dispatch(participantKicked(kicker, kicked)));

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_SOURCE_UPDATED,
        (jitsiParticipant: IJitsiParticipant) => dispatch(participantSourcesUpdated(jitsiParticipant)));

    conference.on(
        JitsiConferenceEvents.LOCK_STATE_CHANGED,
        (locked: boolean) => dispatch(lockStateChanged(conference, locked)));

    conference.on(
        JitsiConferenceEvents.PROPERTIES_CHANGED,
        (properties: Object) => dispatch(conferencePropertiesChanged(properties)));

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
                const trackType = track.jitsiTrack.getType();

                // Do not remove the audio track on RN. Starting with iOS 15 it will fail to unmute otherwise.
                if ((audioMuted && trackType === MEDIA_TYPE.AUDIO && navigator.product !== 'ReactNative')
                        || (videoMuted && trackType === MEDIA_TYPE.VIDEO)) {
                    dispatch(replaceLocalTrack(track.jitsiTrack, null, conference));
                }
            }
        });

    conference.on(
        JitsiConferenceEvents.AUDIO_UNMUTE_PERMISSIONS_CHANGED,
        (disableAudioMuteChange: boolean) => {
            dispatch(setAudioUnmutePermissions(disableAudioMuteChange));
        });
    conference.on(
        JitsiConferenceEvents.VIDEO_UNMUTE_PERMISSIONS_CHANGED,
        (disableVideoMuteChange: boolean) => {
            dispatch(setVideoUnmutePermissions(disableVideoMuteChange));
        });

    // Dispatches into features/base/tracks follow:

    conference.on(
        JitsiConferenceEvents.TRACK_ADDED,
        (t: any) => t && !t.isLocal() && dispatch(trackAdded(t)));
    conference.on(
        JitsiConferenceEvents.TRACK_REMOVED,
        (t: any) => t && !t.isLocal() && dispatch(trackRemoved(t)));

    conference.on(
        JitsiConferenceEvents.TRACK_MUTE_CHANGED,
        (track: any, participantThatMutedUs: any) => {
            if (participantThatMutedUs) {
                dispatch(participantMutedUs(participantThatMutedUs, track));
            }
        });

    conference.on(JitsiConferenceEvents.TRACK_UNMUTE_REJECTED, (track: any) => dispatch(destroyLocalTracks(track)));

    // Dispatches into features/base/participants follow:
    conference.on(
        JitsiConferenceEvents.DISPLAY_NAME_CHANGED,
        (id: string, displayName: string) => dispatch(participantUpdated({
            conference,
            id,
            name: getNormalizedDisplayName(displayName)
        })));

    conference.on(
        JitsiConferenceEvents.SILENT_STATUS_CHANGED,
        (id: string, isSilent: boolean) => dispatch(participantUpdated({
            conference,
            id,
            isSilent
        })));

    conference.on(
        JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
        (dominant: string, previous: string[], silence: boolean | string) => {
            dispatch(dominantSpeakerChanged(dominant, previous, Boolean(silence), conference));
        });

    conference.on(
        JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
        (participant: Object, json: Object) => dispatch(endpointMessageReceived(participant, json)));

    conference.on(
        JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED,
        (id: string, json: Object) => dispatch(nonParticipantMessageReceived(id, json)));

    conference.on(
        JitsiConferenceEvents.USER_JOINED,
        (_id: string, user: any) => commonUserJoinedHandling({ dispatch }, conference, user));
    conference.on(
        JitsiConferenceEvents.USER_LEFT,
        (_id: string, user: any) => commonUserLeftHandling({ dispatch }, conference, user));
    conference.on(
        JitsiConferenceEvents.USER_ROLE_CHANGED,
        (id: string, role: string) => dispatch(participantRoleChanged(id, role)));
    conference.on(
        JitsiConferenceEvents.USER_STATUS_CHANGED,
        (id: string, presence: string) => dispatch(participantPresenceChanged(id, presence)));

    conference.on(
        JitsiE2ePingEvents.E2E_RTT_CHANGED,
        (participant: Object, rtt: number) => dispatch(e2eRttChanged(participant, rtt)));

    conference.on(
        JitsiConferenceEvents.BOT_TYPE_CHANGED,
        (id: string, botType: string) => dispatch(participantUpdated({
            conference,
            id,
            botType
        })));

    conference.on(
        JitsiConferenceEvents.TRANSCRIPTION_STATUS_CHANGED,
        (status: string, id: string, abruptly: boolean) => {
            if (status === JitsiMeetJS.constants.transcriptionStatus.ON) {
                dispatch(transcriberJoined(id));
            } else if (status === JitsiMeetJS.constants.transcriptionStatus.OFF) {
                dispatch(transcriberLeft(id, abruptly));
            }
        });

    conference.addCommandListener(
        AVATAR_URL_COMMAND,
        (data: { value: string; }, id: string) => {
            const participant = getParticipantByIdOrUndefined(state, id);

            // if already set from presence(jwt), skip the command processing
            if (!participant?.avatarURL) {
                return dispatch(participantUpdated({
                    conference,
                    id,
                    avatarURL: data.value
                }));
            }
        });
    conference.addCommandListener(
        EMAIL_COMMAND,
        (data: { value: string; }, id: string) => dispatch(participantUpdated({
            conference,
            id,
            email: data.value
        })));
}

/**
 * Action for updating the conference metadata.
 *
 * @param {IConferenceMetadata} metadata - The metadata object.
 * @returns {{
 *    type: UPDATE_CONFERENCE_METADATA,
 *    metadata: IConferenceMetadata
 * }}
 */
export function updateConferenceMetadata(metadata: IConferenceMetadata | null) {
    return {
        type: UPDATE_CONFERENCE_METADATA,
        metadata
    };
}

/**
 * Create an action for when the end-to-end RTT against a specific remote participant has changed.
 *
 * @param {Object} participant - The participant against which the rtt is measured.
 * @param {number} rtt - The rtt.
 * @returns {{
 *     type: E2E_RTT_CHANGED,
 *     e2eRtt: {
 *         participant: Object,
 *         rtt: number
 *     }
 * }}
 */
export function e2eRttChanged(participant: Object, rtt: number) {
    return {
        type: E2E_RTT_CHANGED,
        e2eRtt: {
            rtt,
            participant
        }
    };
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
export function conferenceFailed(conference: IJitsiConference, error: string, ...params: any) {
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
export function conferenceJoined(conference: IJitsiConference) {
    return {
        type: CONFERENCE_JOINED,
        conference
    };
}

/**
 * Signals that a specific conference join is in progress.
 *
 * @param {JitsiConference} conference - The JitsiConference instance for which join by the local participant
 * is in progress.
 * @returns {{
 *     type: CONFERENCE_JOIN_IN_PROGRESS,
 *     conference: JitsiConference
 * }}
 */
export function conferenceJoinInProgress(conference: IJitsiConference) {
    return {
        type: CONFERENCE_JOIN_IN_PROGRESS,
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
export function conferenceLeft(conference?: IJitsiConference) {
    return {
        type: CONFERENCE_LEFT,
        conference
    };
}

/**
 * Signals that the conference properties have been changed.
 *
 * @param {Object} properties - The new properties set.
 * @returns {{
 *     type: CONFERENCE_PROPERTIES_CHANGED,
 *     properties: Object
 * }}
 */
export function conferencePropertiesChanged(properties: object) {
    return {
        type: CONFERENCE_PROPERTIES_CHANGED,
        properties
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
export function conferenceUniqueIdSet(conference: IJitsiConference) {
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
export function _conferenceWillJoin(conference: IJitsiConference) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const localTracks
            = getLocalTracks(state['features/base/tracks'])
                .map(t => t.jitsiTrack);

        if (localTracks.length && !iAmVisitor(state)) {
            _addLocalTracksToConference(conference, localTracks);
        }

        dispatch(conferenceWillJoin(conference));
    };
}

/**
 * Signals the intention of the application to have a conference initialized.
 *
 * @returns {{
 *     type: CONFERENCE_WILL_INIT
 * }}
 */
export function conferenceWillInit() {
    return {
        type: CONFERENCE_WILL_INIT
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
export function conferenceWillJoin(conference?: IJitsiConference) {
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
 * @param {boolean} isRedirect - Indicates if the action has been dispatched as part of visitor promotion.
 * @returns {{
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference,
 *     isRedirect: boolean
 * }}
 */
export function conferenceWillLeave(conference?: IJitsiConference, isRedirect?: boolean) {
    return {
        type: CONFERENCE_WILL_LEAVE,
        conference,
        isRedirect
    };
}

/**
 * Initializes a new conference.
 *
 * @param {string} overrideRoom - Override the room to join, instead of taking it
 * from Redux.
 * @returns {Function}
 */
export function createConference(overrideRoom?: string | String) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { connection, locationURL } = state['features/base/connection'];

        if (!connection) {
            throw new Error('Cannot create a conference without a connection!');
        }

        const { password, room } = state['features/base/conference'];

        if (!room) {
            throw new Error('Cannot join a conference without a room name!');
        }

        // XXX: revisit this.
        // Hide the custom domain in the room name.
        const tmp: any = overrideRoom || room;
        let _room: any = getBackendSafeRoomName(tmp);

        if (tmp.domain) {
            // eslint-disable-next-line no-new-wrappers
            _room = new String(tmp);
            _room.domain = tmp.domain;
        }

        const conference = connection.initJitsiConference(_room, getConferenceOptions(state));

        // @ts-ignore
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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { authRequired, password }
            = getState()['features/base/conference'];

        const replaceParticipant = getReplaceParticipant(getState());

        authRequired && dispatch(_conferenceWillJoin(authRequired));
        authRequired?.join(password, replaceParticipant);
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
 * Signals the data channel with the bridge was abruptly closed.
 *
 * @param {number} code - Close code.
 * @param {string} reason - Close reason.
 *
 * @returns {{
 *     type: DATA_CHANNEL_CLOSED,
 *     code: number,
 *     reason: string
 * }}
 */
export function dataChannelClosed(code: number, reason: string) {
    return {
        type: DATA_CHANNEL_CLOSED,
        code,
        reason
    };
}

/**
 * Signals that a participant sent an endpoint message on the data channel.
 *
 * @param {Object} participant - The participant details sending the message.
 * @param {Object} data - The data carried by the endpoint message.
 * @returns {{
*      type: ENDPOINT_MESSAGE_RECEIVED,
*      participant: Object,
*      data: Object
* }}
*/
export function endpointMessageReceived(participant: Object, data: Object) {
    return {
        type: ENDPOINT_MESSAGE_RECEIVED,
        participant,
        data
    };
}

/**
 * Action to end a conference for all participants.
 *
 * @returns {Function}
 */
export function endConference() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { conference } = getConferenceState(toState(getState));

        conference?.end();
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
export function kickedOut(conference: IJitsiConference, participant: Object) {
    return {
        type: KICKED_OUT,
        conference,
        participant
    };
}


/**
 * Action to leave a conference.
 *
 * @returns {Function}
 */
export function leaveConference() {
    return async (dispatch: IStore['dispatch']) => dispatch(hangup(true));
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
export function lockStateChanged(conference: IJitsiConference, locked: boolean) {
    return {
        type: LOCK_STATE_CHANGED,
        conference,
        locked
    };
}

/**
 * Signals that a non participant endpoint message has been received.
 *
 * @param {string} id - The resource id of the sender.
 * @param {Object} json - The json carried by the endpoint message.
 * @returns {{
 *      type: NON_PARTICIPANT_MESSAGE_RECEIVED,
 *      id: Object,
 *      json: Object
 * }}
 */
export function nonParticipantMessageReceived(id: string, json: Object) {
    return {
        type: NON_PARTICIPANT_MESSAGE_RECEIVED,
        id,
        json
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
 * Enables or disables the Follow Me feature used only for the recorder.
 *
 * @param {boolean} enabled - Whether Follow Me should be enabled and used only by the recorder.
 * @returns {{
 *     type: SET_FOLLOW_ME_RECORDER,
 *     enabled: boolean
 * }}
 */
export function setFollowMeRecorder(enabled: boolean) {
    return {
        type: SET_FOLLOW_ME_RECORDER,
        enabled
    };
}

/**
 * Enables or disables the Mute reaction sounds feature.
 *
 * @param {boolean} muted - Whether or not reaction sounds should be muted for all participants.
 * @param {boolean} updateBackend - Whether or not the moderator should notify all participants for the new setting.
 * @returns {{
 *     type: SET_START_REACTIONS_MUTED,
 *     muted: boolean
 * }}
 */
export function setStartReactionsMuted(muted: boolean, updateBackend = false) {
    return {
        type: SET_START_REACTIONS_MUTED,
        muted,
        updateBackend
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
        conference: IJitsiConference | undefined,
        method: Function | undefined,
        password?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!conference) {
            return Promise.reject();
        }
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
                        .catch((error: Error) => dispatch({
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
 * Sets the obfuscated room name of the conference to be joined.
 *
 * @param {(string)} obfuscatedRoom - Obfuscated room name.
 * @param {(string)} obfuscatedRoomSource - The room name that was obfuscated.
 * @returns {{
 *     type: SET_OBFUSCATED_ROOM,
 *     room: string
 * }}
 */
export function setObfuscatedRoom(obfuscatedRoom: string, obfuscatedRoomSource: string) {
    return {
        type: SET_OBFUSCATED_ROOM,
        obfuscatedRoom,
        obfuscatedRoomSource
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
export function setRoom(room?: string) {
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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState());

        conference?.setStartMutedPolicy({
            audio: startAudioMuted,
            video: startVideoMuted
        });

        dispatch(
            onStartMutedPolicyChanged(startAudioMuted, startVideoMuted));
    };
}

/**
 * Sets the conference subject.
 *
 * @param {string} subject - The new subject.
 * @returns {void}
 */
export function setSubject(subject: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { conference } = getState()['features/base/conference'];

        if (conference) {
            conference.setSubject(subject);
        } else {
            dispatch({
                type: SET_PENDING_SUBJECT_CHANGE,
                subject
            });
        }
    };
}

/**
 * Sets the conference local subject.
 *
 * @param {string} localSubject - The new local subject.
 * @returns {{
 *     type: CONFERENCE_LOCAL_SUBJECT_CHANGED,
 *     localSubject: string
 * }}
 */
export function setLocalSubject(localSubject: string) {
    return {
        type: CONFERENCE_LOCAL_SUBJECT_CHANGED,
        localSubject
    };
}


/**
 * Sets the assumed bandwidth bps.
 *
 * @param {number} assumedBandwidthBps - The new assumed bandwidth.
 * @returns {{
*     type: SET_ASSUMED_BANDWIDTH_BPS,
*     assumedBandwidthBps: number
* }}
*/
export function setAssumedBandwidthBps(assumedBandwidthBps: number) {
    return {
        type: SET_ASSUMED_BANDWIDTH_BPS,
        assumedBandwidthBps
    };
}

/**
 * Redirects to a new visitor node.
 *
 * @param {string | undefined} vnode - The vnode to use or undefined if moving back to the main room.
 * @param {string} focusJid - The focus jid to use.
 * @param {string} username - The username to use.
 * @returns {void}
 */
export function redirect(vnode: string, focusJid: string, username: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const newConfig = getVisitorOptions(getState, vnode, focusJid, username);

        if (!newConfig) {
            logger.warn('Not redirected missing params');

            return;
        }

        dispatch(overwriteConfig(newConfig));

        dispatch(disconnect(true))
            .then(() => {
                dispatch(setIAmVisitor(Boolean(vnode)));

                // we do not clear local tracks on error, so we need to manually clear them
                return dispatch(destroyLocalTracks());
            })
            .then(() => {
                dispatch(conferenceWillInit());
                logger.info(`Dispatching connect from redirect (visitor = ${Boolean(vnode)}).`);

                return dispatch(connect());
            })
            .then(() => {
                const media: Array<MediaType> = [];

                if (!vnode) {
                    const state = getState();
                    const { enableMediaOnPromote = {} } = state['features/base/config'].visitors ?? {};
                    const { audio = false, video = false } = enableMediaOnPromote;

                    if (audio) {
                        const { available, muted, unmuteBlocked } = state['features/base/media'].audio;
                        const { startSilent } = state['features/base/config'];

                        // do not unmute the user if he was muted before (on the prejoin, the config
                        // or URL param, etc.)
                        if (!unmuteBlocked && !muted && !startSilent && available) {
                            media.push(MEDIA_TYPE.AUDIO);
                        }
                    }

                    if (video) {
                        const { muted, unmuteBlocked } = state['features/base/media'].video;

                        // do not unmute the user if he was muted before (on the prejoin, the config, URL param or
                        // audo only, etc)
                        if (!unmuteBlocked && !muted && hasAvailableDevices(state, 'videoInput')) {
                            media.push(MEDIA_TYPE.VIDEO);
                        }
                    }
                }

                dispatch(setupVisitorStartupMedia(media));
            });
    };
}

