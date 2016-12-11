import { Symbol } from '../react';

/**
 * Action type to signal that we are joining the conference.
 *
 * {
 *      type: CONFERENCE_JOINED,
 *      conference: {
 *          jitsiConference: JitsiConference
 *      }
 * }
 */
export const CONFERENCE_JOINED = Symbol('CONFERENCE_JOINED');

/**
 * Action type to signal that we have left the conference.
 *
 * {
 *      type: CONFERENCE_LEFT,
 *      conference: {
 *          jitsiConference: JitsiConference
 *      }
 * }
 */
export const CONFERENCE_LEFT = Symbol('CONFERENCE_LEFT');

/**
 * Action type to signal that we will leave the specified conference.
 *
 * {
 *      type: CONFERENCE_WILL_LEAVE,
 *      conference: {
 *          jitsiConference: JitsiConference
 *      }
 * }
 */
export const CONFERENCE_WILL_LEAVE = Symbol('CONFERENCE_WILL_LEAVE');

/**
 * The type of the Redux action which sets the name of the room of the
 * conference to be joined.
 *
 * {
 *      type: SET_ROOM,
 *      room: string
 * }
 */
export const SET_ROOM = Symbol('SET_ROOM');
