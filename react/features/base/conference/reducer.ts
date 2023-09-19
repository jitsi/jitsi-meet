import { AnyAction } from 'redux';

import { FaceLandmarks } from '../../face-landmarks/types';
import { LOCKED_LOCALLY, LOCKED_REMOTELY } from '../../room-lock/constants';
import { ISpeakerStats } from '../../speaker-stats/reducer';
import { CONNECTION_WILL_CONNECT, SET_LOCATION_URL } from '../connection/actionTypes';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import ReducerRegistry from '../redux/ReducerRegistry';
import { assign, set } from '../redux/functions';

import {
    AUTH_STATUS_CHANGED,
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_LOCAL_SUBJECT_CHANGED,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_TIMESTAMP_CHANGED,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    LOCK_STATE_CHANGED,
    P2P_STATUS_CHANGED,
    SET_ASSUMED_BANDWIDTH_BPS,
    SET_FOLLOW_ME,
    SET_OBFUSCATED_ROOM,
    SET_PASSWORD,
    SET_PENDING_SUBJECT_CHANGE,
    SET_ROOM,
    SET_START_MUTED_POLICY,
    SET_START_REACTIONS_MUTED
} from './actionTypes';
import { isRoomValid } from './functions';

const DEFAULT_STATE = {
    assumedBandwidthBps: undefined,
    conference: undefined,
    e2eeSupported: undefined,
    joining: undefined,
    leaving: undefined,
    locked: undefined,
    membersOnly: undefined,
    password: undefined,
    passwordRequired: undefined
};

export interface IJitsiConference {
    addCommandListener: Function;
    addLobbyMessageListener: Function;
    addTrack: Function;
    authenticateAndUpgradeRole: Function;
    avModerationApprove: Function;
    avModerationReject: Function;
    callUUID?: string;
    createVideoSIPGWSession: Function;
    dial: Function;
    disableAVModeration: Function;
    disableLobby: Function;
    enableAVModeration: Function;
    enableLobby: Function;
    end: Function;
    getBreakoutRooms: Function;
    getConnection: Function;
    getLocalParticipantProperty: Function;
    getLocalTracks: Function;
    getMeetingUniqueId: Function;
    getMetadataHandler: Function;
    getName: Function;
    getParticipantById: Function;
    getParticipantCount: Function;
    getParticipants: Function;
    getRole: Function;
    getSpeakerStats: () => ISpeakerStats;
    getSsrcByTrack: Function;
    grantOwner: Function;
    isAVModerationSupported: Function;
    isCallstatsEnabled: Function;
    isE2EEEnabled: Function;
    isE2EESupported: Function;
    isEndConferenceSupported: Function;
    isLobbySupported: Function;
    isP2PActive: Function;
    isSIPCallingSupported: Function;
    isStartAudioMuted: Function;
    isStartVideoMuted: Function;
    join: Function;
    joinLobby: Function;
    kickParticipant: Function;
    leave: Function;
    lobbyApproveAccess: Function;
    lobbyDenyAccess: Function;
    lock: Function;
    markParticipantVerified: Function;
    muteParticipant: Function;
    myLobbyUserId: Function;
    myUserId: Function;
    off: Function;
    on: Function;
    options: any;
    removeTrack: Function;
    replaceTrack: Function;
    room: IJitsiConferenceRoom;
    sendApplicationLog: Function;
    sendCommand: Function;
    sendCommandOnce: Function;
    sendEndpointMessage: Function;
    sendFaceLandmarks: (faceLandmarks: FaceLandmarks) => void;
    sendFeedback: Function;
    sendLobbyMessage: Function;
    sendMessage: Function;
    sendPrivateTextMessage: Function;
    sendTextMessage: Function;
    sendTones: Function;
    sessionId: string;
    setAssumedBandwidthBps: (value: number) => void;
    setDesktopSharingFrameRate: Function;
    setDisplayName: Function;
    setLocalParticipantProperty: Function;
    setMediaEncryptionKey: Function;
    setReceiverConstraints: Function;
    setSenderVideoConstraint: Function;
    setStartMutedPolicy: Function;
    setSubject: Function;
    startRecording: Function;
    startVerification: Function;
    stopRecording: Function;
    toggleE2EE: Function;
}

export interface IConferenceState {
    assumedBandwidthBps?: number;
    authEnabled?: boolean;
    authLogin?: string;
    authRequired?: IJitsiConference;
    conference?: IJitsiConference;
    conferenceTimestamp?: number;
    e2eeSupported?: boolean;
    error?: Error;
    followMeEnabled?: boolean;
    joining?: IJitsiConference;
    leaving?: IJitsiConference;
    lobbyWaitingForHost?: boolean;
    localSubject?: string;
    locked?: string;
    membersOnly?: IJitsiConference;
    obfuscatedRoom?: string;
    obfuscatedRoomSource?: string;
    p2p?: Object;
    password?: string;
    passwordRequired?: IJitsiConference;
    pendingSubjectChange?: string;
    room?: string;
    startAudioMutedPolicy?: boolean;
    startReactionsMuted?: boolean;
    startVideoMutedPolicy?: boolean;
    subject?: string;
}

export interface IJitsiConferenceRoom {
    locked: boolean;
    myroomjid: string;
    roomjid: string;
    xmpp: {
        moderator: {
            logout: Function;
        };
    };
}

interface IConferenceFailedError extends Error {
    params: Array<any>;
}

/**
 * Listen for actions that contain the conference object, so that it can be
 * stored for use by other action creators.
 */
ReducerRegistry.register<IConferenceState>('features/base/conference',
    (state = DEFAULT_STATE, action): IConferenceState => {
        switch (action.type) {
        case AUTH_STATUS_CHANGED:
            return _authStatusChanged(state, action);

        case CONFERENCE_FAILED:
            return _conferenceFailed(state, action);

        case CONFERENCE_JOINED:
            return _conferenceJoined(state, action);

        case CONFERENCE_SUBJECT_CHANGED:
            return set(state, 'subject', action.subject);

        case CONFERENCE_LOCAL_SUBJECT_CHANGED:
            return set(state, 'localSubject', action.localSubject);

        case CONFERENCE_TIMESTAMP_CHANGED:
            return set(state, 'conferenceTimestamp', action.conferenceTimestamp);

        case CONFERENCE_LEFT:
        case CONFERENCE_WILL_LEAVE:
            return _conferenceLeftOrWillLeave(state, action);

        case CONFERENCE_WILL_JOIN:
            return _conferenceWillJoin(state, action);

        case CONNECTION_WILL_CONNECT:
            return set(state, 'authRequired', undefined);

        case LOCK_STATE_CHANGED:
            return _lockStateChanged(state, action);

        case P2P_STATUS_CHANGED:
            return _p2pStatusChanged(state, action);

        case SET_ASSUMED_BANDWIDTH_BPS: {
            const assumedBandwidthBps = action.assumedBandwidthBps >= 0
                ? Number(action.assumedBandwidthBps)
                : undefined;

            return set(state, 'assumedBandwidthBps', assumedBandwidthBps);
        }
        case SET_FOLLOW_ME:
            return set(state, 'followMeEnabled', action.enabled);

        case SET_START_REACTIONS_MUTED:
            return set(state, 'startReactionsMuted', action.muted);

        case SET_LOCATION_URL:
            return set(state, 'room', undefined);

        case SET_OBFUSCATED_ROOM:
            return { ...state,
                obfuscatedRoom: action.obfuscatedRoom,
                obfuscatedRoomSource: action.obfuscatedRoomSource
            };

        case SET_PASSWORD:
            return _setPassword(state, action);

        case SET_PENDING_SUBJECT_CHANGE:
            return set(state, 'pendingSubjectChange', action.subject);

        case SET_ROOM:
            return _setRoom(state, action);

        case SET_START_MUTED_POLICY:
            return {
                ...state,
                startAudioMutedPolicy: action.startAudioMutedPolicy,
                startVideoMutedPolicy: action.startVideoMutedPolicy
            };
        }

        return state;
    });

/**
 * Reduces a specific Redux action AUTH_STATUS_CHANGED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action AUTH_STATUS_CHANGED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _authStatusChanged(state: IConferenceState,
        { authEnabled, authLogin }: { authEnabled: boolean; authLogin: string; }) {
    return assign(state, {
        authEnabled,
        authLogin
    });
}

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
function _conferenceFailed(state: IConferenceState, { conference, error }: {
    conference: IJitsiConference; error: IConferenceFailedError; }) {
    // The current (similar to getCurrentConference in
    // base/conference/functions.any.js) conference which is joining or joined:
    const conference_ = state.conference || state.joining;

    if (conference_ && conference_ !== conference) {
        return state;
    }

    let authRequired;
    let membersOnly;
    let passwordRequired;
    let lobbyWaitingForHost;

    switch (error.name) {
    case JitsiConferenceErrors.AUTHENTICATION_REQUIRED:
        authRequired = conference;
        break;

    case JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED:
    case JitsiConferenceErrors.MEMBERS_ONLY_ERROR: {
        membersOnly = conference;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [ _lobbyJid, _lobbyWaitingForHost ] = error.params;

        lobbyWaitingForHost = _lobbyWaitingForHost;

        break;
    }

    case JitsiConferenceErrors.PASSWORD_REQUIRED:
        passwordRequired = conference;
        break;
    }

    return assign(state, {
        authRequired,
        conference: undefined,
        e2eeSupported: undefined,
        error,
        joining: undefined,
        leaving: undefined,
        lobbyWaitingForHost,

        /**
         * The indicator of how the conference/room is locked. If falsy, the
         * conference/room is unlocked; otherwise, it's either
         * {@code LOCKED_LOCALLY} or {@code LOCKED_REMOTELY}.
         *
         * @type {string}
         */
        locked: passwordRequired ? LOCKED_REMOTELY : undefined,
        membersOnly,
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
function _conferenceJoined(state: IConferenceState, { conference }: { conference: IJitsiConference; }) {
    // FIXME The indicator which determines whether a JitsiConference is locked
    // i.e. password-protected is private to lib-jitsi-meet. However, the
    // library does not fire LOCK_STATE_CHANGED upon joining a JitsiConference
    // with a password.
    // FIXME Technically JitsiConference.room is a private field.
    const locked = conference.room?.locked ? LOCKED_REMOTELY : undefined;

    return assign(state, {
        authRequired: undefined,

        /**
         * The JitsiConference instance represented by the Redux state of the
         * feature base/conference.
         *
         * @type {JitsiConference}
         */
        conference,

        e2eeSupported: conference.isE2EESupported(),

        joining: undefined,
        membersOnly: undefined,
        leaving: undefined,

        lobbyWaitingForHost: undefined,

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
 * Reduces a specific redux action {@link CONFERENCE_LEFT} or
 * {@link CONFERENCE_WILL_LEAVE} for the feature base/conference.
 *
 * @param {Object} state - The redux state of the feature base/conference.
 * @param {Action} action - The redux action {@code CONFERENCE_LEFT} or
 * {@code CONFERENCE_WILL_LEAVE} to reduce.
 * @private
 * @returns {Object} The next/new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _conferenceLeftOrWillLeave(state: IConferenceState, { conference, type }:
    { conference: IJitsiConference; type: string; }) {
    const nextState = { ...state };

    // The redux action CONFERENCE_LEFT is the last time that we should be
    // hearing from a JitsiConference instance.
    //
    // The redux action CONFERENCE_WILL_LEAVE represents the order of the user
    // to leave a JitsiConference instance. From the user's perspective, there's
    // no going back (with respect to the instance itself). The app will perform
    // due clean-up like leaving the associated room, but the instance is no
    // longer the focus of the attention of the user and, consequently, the app.
    for (const p in state) {
        if (state[p as keyof IConferenceState] === conference) {
            nextState[p as keyof IConferenceState] = undefined;

            switch (p) {
            case 'conference':
            case 'passwordRequired':
                // XXX Clear/unset locked & password for a conference which has
                // been LOCKED_LOCALLY or LOCKED_REMOTELY.
                delete nextState.locked;
                delete nextState.password;
                break;
            }
        }
    }

    if (type === CONFERENCE_WILL_LEAVE) {
        // A CONFERENCE_WILL_LEAVE is of further consequence only if it is
        // expected i.e. if the specified conference is joining or joined.
        if (conference === state.joining || conference === state.conference) {
            /**
             * The JitsiConference instance which is currently in the process of
             * being left.
             *
             * @type {JitsiConference}
             */
            nextState.leaving = conference;
        }
    }

    return nextState;
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
function _conferenceWillJoin(state: IConferenceState, { conference }: { conference: IJitsiConference; }) {
    return assign(state, {
        error: undefined,
        joining: conference
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
function _lockStateChanged(state: IConferenceState, { conference, locked }: { conference: Object; locked: boolean; }) {
    if (state.conference !== conference) {
        return state;
    }

    return assign(state, {
        locked: locked ? state.locked || LOCKED_REMOTELY : undefined,
        password: locked ? state.password : undefined
    });
}

/**
 * Reduces a specific Redux action P2P_STATUS_CHANGED of the feature
 * base/conference.
 *
 * @param {Object} state - The Redux state of the feature base/conference.
 * @param {Action} action - The Redux action P2P_STATUS_CHANGED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/conference after the
 * reduction of the specified action.
 */
function _p2pStatusChanged(state: IConferenceState, action: AnyAction) {
    return set(state, 'p2p', action.p2p);
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
function _setPassword(state: IConferenceState, { conference, method, password }: {
    conference: IJitsiConference; method: Object; password: string; }) {
    switch (method) {
    case conference.join:
        return assign(state, {
            // 1. The JitsiConference which transitions away from
            // passwordRequired MUST remain in the redux state
            // features/base/conference until it transitions into
            // conference; otherwise, there is a span of time during which
            // the redux state does not even know that there is a
            // JitsiConference whatsoever.
            //
            // 2. The redux action setPassword will attempt to join the
            // JitsiConference so joining is an appropriate transitional
            // redux state.
            //
            // 3. The redux action setPassword will perform the same check
            // before it proceeds with the re-join.
            joining: state.conference ? state.joining : conference,
            locked: LOCKED_REMOTELY,

            /**
             * The password with which the conference is to be joined.
             *
             * @type {string}
             */
            password
        });

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
function _setRoom(state: IConferenceState, action: AnyAction) {
    let { room } = action;

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
    return assign(state, {
        error: undefined,
        room
    });
}

