/**
 * The type of (redux) action which signals that server authentication has
 * becoming available or unavailable or logged in user has changed.
 *
 * {
 *     type: AUTH_STATUS_CHANGED,
 *     authEnabled: boolean,
 *     authLogin: string
 * }
 */
export const AUTH_STATUS_CHANGED = 'AUTH_STATUS_CHANGED';

/**
 * The type of (redux) action which signals that a specific conference failed.
 *
 * {
 *     type: CONFERENCE_FAILED,
 *     conference: JitsiConference,
 *     error: Error
 * }
 */
export const CONFERENCE_FAILED = 'CONFERENCE_FAILED';

/**
 * The type of (redux) action which signals that a specific conference was
 * joined.
 *
 * {
 *     type: CONFERENCE_JOINED,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_JOINED = 'CONFERENCE_JOINED';

/**
 * The type of (redux) action which signals that a specific conference was left.
 *
 * {
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_LEFT = 'CONFERENCE_LEFT';

/**
 * The type of (redux) action, which indicates conference subject changes.
 *
 * {
 *     type: CONFERENCE_SUBJECT_CHANGED
 *     subject: string
 * }
 */
export const CONFERENCE_SUBJECT_CHANGED = 'CONFERENCE_SUBJECT_CHANGED';

/**
* The type of (redux) action, which indicates conference UTC timestamp changes.
*
* {
*      type: CONFERENCE_TIMESTAMP_CHANGED
*      timestamp: number
* }
*/
export const CONFERENCE_TIMESTAMP_CHANGED = 'CONFERENCE_TIMESTAMP_CHANGED';

/**
 * The type of (redux) action which signals that a specific conference will be
 * joined.
 *
 * {
 *     type: CONFERENCE_WILL_JOIN,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_WILL_JOIN = 'CONFERENCE_WILL_JOIN';

/**
 * The type of (redux) action which signals that a specific conference will be
 * left.
 *
 * {
 *     type: CONFERENCE_WILL_LEAVE,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_WILL_LEAVE = 'CONFERENCE_WILL_LEAVE';

/**
 * The type of (redux) action which signals that the data channel with the
 * bridge has been established.
 *
 * {
 *     type: DATA_CHANNEL_OPENED
 * }
 */
export const DATA_CHANNEL_OPENED = 'DATA_CHANNEL_OPENED';

/**
 * The type of action which signals that the user has been kicked out from
 * the conference.
 *
 * {
 *     type: KICKED_OUT,
 *     conference: JitsiConference
 * }
 */
export const KICKED_OUT = 'KICKED_OUT';

/**
 * The type of (redux) action which signals that the lock state of a specific
 * {@code JitsiConference} changed.
 *
 * {
 *     type: LOCK_STATE_CHANGED,
 *     conference: JitsiConference,
 *     locked: boolean
 * }
 */
export const LOCK_STATE_CHANGED = 'LOCK_STATE_CHANGED';

/**
 * The type of (redux) action which sets the peer2peer flag for the current
 * conference.
 *
 * {
 *     type: P2P_STATUS_CHANGED,
 *     p2p: boolean
 * }
 */
export const P2P_STATUS_CHANGED = 'P2P_STATUS_CHANGED';

/**
 * The type of (redux) action which signals to play specified touch tones.
 *
 * {
 *     type: SEND_TONES,
 *     tones: string,
 *     duration: number,
 *     pause: number
 * }
 */
export const SEND_TONES = 'SEND_TONES';

/**
 * The type of (redux) action which sets the desktop sharing enabled flag for
 * the current conference.
 *
 * {
 *     type: SET_DESKTOP_SHARING_ENABLED,
 *     desktopSharingEnabled: boolean
 * }
 */
export const SET_DESKTOP_SHARING_ENABLED
    = 'SET_DESKTOP_SHARING_ENABLED';

/**
 * The type of (redux) action which updates the current known status of the
 * Follow Me feature.
 *
 * {
 *     type: SET_FOLLOW_ME,
 *     enabled: boolean
 * }
 */
export const SET_FOLLOW_ME = 'SET_FOLLOW_ME';

/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY
    = 'SET_MAX_RECEIVER_VIDEO_QUALITY';

/**
 * The type of (redux) action which sets the password to join or lock a specific
 * {@code JitsiConference}.
 *
 * {
 *     type: SET_PASSWORD,
 *     conference: JitsiConference,
 *     method: Function
 *     password: string
 * }
 */
export const SET_PASSWORD = 'SET_PASSWORD';

/**
 * The type of (redux) action which signals that setting a password on a
 * {@code JitsiConference} failed (with an error).
 *
 * {
 *     type: SET_PASSWORD_FAILED,
 *     error: string
 * }
 */
export const SET_PASSWORD_FAILED = 'SET_PASSWORD_FAILED';

/**
 * The type of (redux) action which signals for pending subject changes.
 *
 * {
 *     type: SET_PENDING_SUBJECT_CHANGE,
 *     subject: string
 * }
 */
export const SET_PENDING_SUBJECT_CHANGE = 'SET_PENDING_SUBJECT_CHANGE';

/**
 * The type of (redux) action which sets the preferred maximum video height that
 * should be sent to and received from remote participants.
 *
 * {
 *     type: SET_PREFERRED_VIDEO_QUALITY,
 *     preferredVideoQuality: number
 * }
 */
export const SET_PREFERRED_VIDEO_QUALITY = 'SET_PREFERRED_VIDEO_QUALITY';

/**
 * The type of (redux) action which sets the name of the room of the
 * conference to be joined.
 *
 * {
 *     type: SET_ROOM,
 *     room: string
 * }
 */
export const SET_ROOM = 'SET_ROOM';

/**
 * The type of (redux) action, which indicates if a SIP gateway is enabled on
 * the server.
 *
 * {
 *     type: SET_SIP_GATEWAY_ENABLED
 *     isSIPGatewayEnabled: boolean
 * }
 */
export const SET_SIP_GATEWAY_ENABLED = 'SET_SIP_GATEWAY_ENABLED';

/**
 * The type of (redux) action which updates the current known status of the
 * moderator features for starting participants as audio or video muted.
 *
 * {
 *     type: SET_START_MUTED_POLICY,
 *     startAudioMutedPolicy: boolean,
 *     startVideoMutedPolicy: boolean
 * }
 */
export const SET_START_MUTED_POLICY = 'SET_START_MUTED_POLICY';
