/**
 * Action for when a track has been added to the conference,
 * local or remote.
 *
 * {
 *     type: TRACK_ADDED,
 *     track: Track
 * }
 */
export const TRACK_ADDED = Symbol('TRACK_ADDED');

/**
 * Action for when a track has been removed from the conference,
 * local or remote.
 *
 * {
 *     type: TRACK_REMOVED,
 *     track: Track
 * }
 */
export const TRACK_REMOVED = Symbol('TRACK_REMOVED');

/**
 * Action for when a track properties were updated.
 *
 * {
 *     type: TRACK_UPDATED,
 *     track: Track
 * }
 */
export const TRACK_UPDATED = Symbol('TRACK_UPDATED');
