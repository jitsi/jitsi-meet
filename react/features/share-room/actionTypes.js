/**
 * The type of (redux) action which begins the UI procedure to share the current
 * conference/room URL.
 *
 * {
 *     type: BEGIN_SHARE_ROOM,
 *     roomURL: string,
 *     includeDialInfo: boolean
 * }
 */
export const BEGIN_SHARE_ROOM = 'BEGIN_SHARE_ROOM';

/**
 * The type of (redux) action which ends the UI procedure to share a specific
 * conference/room URL.
 *
 * {
 *     type: END_SHARE_ROOM,
 *     roomURL: string,
 *     shared: boolean
 * }
 */
export const END_SHARE_ROOM = 'END_SHARE_ROOM';
