import { Symbol } from '../base/react';

/**
 * The type of Redux action which begins a (user) request to lock a specific
 * JitsiConference.
 *
 * {
 *     type: BEGIN_ROOM_LOCK_REQUEST,
 *     conference: JitsiConference
 * }
 */
export const BEGIN_ROOM_LOCK_REQUEST = Symbol('BEGIN_ROOM_LOCK_REQUEST');

/**
 * The type of Redux action which end a (user) request to lock a specific
 * JitsiConference.
 *
 * {
 *     type: END_ROOM_LOCK_REQUEST,
 *     conference: JitsiConference,
 *     password: string
 * }
 */
export const END_ROOM_LOCK_REQUEST = Symbol('END_ROOM_LOCK_REQUEST');
