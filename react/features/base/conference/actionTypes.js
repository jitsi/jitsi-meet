import { Symbol } from '../react';

/**
 * The type of the Redux action which signals that a specific conference has
 * failed.
 *
 * {
 *     type: CONFERENCE_FAILED,
 *     conference: JitsiConference,
 *     error: string
 * }
 */
export const CONFERENCE_FAILED = Symbol('CONFERENCE_FAILED');

/**
 * The type of the Redux action which signals that a specific conference has
 * been joined.
 *
 * {
 *     type: CONFERENCE_JOINED,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_JOINED = Symbol('CONFERENCE_JOINED');

/**
 * The type of the Redux action which signals that a specific conference has
 * been left.
 *
 * {
 *     type: CONFERENCE_LEFT,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_LEFT = Symbol('CONFERENCE_LEFT');

/**
 * The type of the Redux action which signals that a specific conference will be
 * left.
 *
 * {
 *     type: CONFERENCE_WILL_LEAVE,
 *     conference: JitsiConference
 * }
 */
export const CONFERENCE_WILL_LEAVE = Symbol('CONFERENCE_WILL_LEAVE');

/**
 * The type of the Redux action which signals that the lock state of a specific
 * <tt>JitsiConference</tt> changed.
 *
 * {
 *     type: LOCK_STATE_CHANGED,
 *     conference: JitsiConference,
 *     locked: boolean
 * }
 */
export const LOCK_STATE_CHANGED = Symbol('LOCK_STATE_CHANGED');

/**
 * The type of the Redux action which sets the password to join or lock a
 * specific JitsiConference.
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
 * The type of the Redux action which sets the name of the room of the
 * conference to be joined.
 *
 * {
 *     type: SET_ROOM,
 *     room: string
 * }
 */
export const SET_ROOM = Symbol('SET_ROOM');
