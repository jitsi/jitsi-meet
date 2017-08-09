/**
 * The type of (redux) action which signals that a specific conference failed.
 *
 * {
 *     type: CONFERENCE_FAILED,
 *     conference: JitsiConference,
 *     error: string
 * }
 */
export const CONFERENCE_FAILED = Symbol('CONFERENCE_FAILED');

/**
 * The type of (redux) action which signals that a specific conference was
 * joined.
 *
 * {
 *     type: CONFERENCE_JOINED,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_JOINED = Symbol('CONFERENCE_JOINED');

/**
 * The type of (redux) action which signals that a specific conference was left.
 *
 * {
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_LEFT = Symbol('CONFERENCE_LEFT');

/**
 * The type of (redux) action which signals that a specific conference will be
 * joined.
 *
 * {
 *     type: CONFERENCE_WILL_JOIN,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_WILL_JOIN = Symbol('CONFERENCE_WILL_JOIN');

/**
 * The type of (redux) action which signals that a specific conference will be
 * left.
 *
 * {
 *     type: CONFERENCE_WILL_LEAVE,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_WILL_LEAVE = Symbol('CONFERENCE_WILL_LEAVE');

/**
 * The type of (redux) action which signals that the data channel with the
 * bridge has been established.
 *
 * {
 *     type: DATA_CHANNEL_OPENED
 * }
 */
export const DATA_CHANNEL_OPENED = Symbol('DATA_CHANNEL_OPENED');

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
export const LOCK_STATE_CHANGED = Symbol('LOCK_STATE_CHANGED');

/**
 * The type of (redux) action which sets the peer2peer flag for the current
 * conference.
 *
 * {
 *     type: P2P_STATUS_CHANGED,
 *     p2p: boolean
 * }
 */
export const P2P_STATUS_CHANGED = Symbol('P2P_STATUS_CHANGED');

/**
 * The type of (redux) action which sets the audio-only flag for the current
 * conference.
 *
 * {
 *     type: SET_AUDIO_ONLY,
 *     audioOnly: boolean
 * }
 */
export const SET_AUDIO_ONLY = Symbol('SET_AUDIO_ONLY');

/**
 * The type of (redux) action which sets the video channel's lastN (value).
 *
 * {
 *     type: SET_LASTN,
 *     lastN: number
 * }
 */
export const SET_LASTN = Symbol('SET_LASTN');

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
export const SET_PASSWORD = Symbol('SET_PASSWORD');

/**
 * The type of (redux) action which signals that setting a password on a
 * {@code JitsiConference} failed (with an error).
 *
 * {
 *     type: SET_PASSWORD_FAILED,
 *     error: string
 * }
 */
export const SET_PASSWORD_FAILED = Symbol('SET_PASSWORD_FAILED');

/**
 * The type of (redux) action which sets the maximum video size should be
 * received from remote participants.
 *
 * {
 *     type: SET_RECEIVE_VIDEO_QUALITY,
 *     receiveVideoQuality: number
 * }
 */
export const SET_RECEIVE_VIDEO_QUALITY = Symbol('SET_RECEIVE_VIDEO_QUALITY');

/**
 * The type of (redux) action which sets the name of the room of the
 * conference to be joined.
 *
 * {
 *     type: SET_ROOM,
 *     room: string
 * }
 */
export const SET_ROOM = Symbol('SET_ROOM');
