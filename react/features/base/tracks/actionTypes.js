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
 * Action triggered when a local track starts being created through the WebRTC
 * getUserMedia call. It will include extra 'gumProcess' field which is
 * a Promise with extra 'cancel' method which can be used to cancel the process.
 * Canceling will result in disposing any JitsiLocalTrack returned by the GUM
 * callback. There will be TRACK_CREATE_CANCELED event instead of track
 * added/gum failed events.
 *
 * {
 *     type: TRACK_BEING_CREATED
 *     track: {
 *         local: true,
 *         gumProcess: Promise with cancel() method to abort,
 *         mediaType: MEDIA_TYPE
 *     }
 * }
 */
export const TRACK_BEING_CREATED = Symbol('TRACK_BEING_CREATED');

/**
 * Action sent when canceled GUM process completes either successfully or with
 * an error (error is ignored and track is immediately disposed if created).
 *
 * {
 *     type: TRACK_CREATE_CANCELED,
 *     trackType: MEDIA_TYPE
 * }
 */
export const TRACK_CREATE_CANCELED = Symbol('TRACK_CREATE_CANCELED');

/**
 * Action sent when GUM fails with an error other than permission denied.
 *
 * {
 *     type: TRACK_CREATE_ERROR,
 *     permissionDenied: Boolean,
 *     trackType: MEDIA_TYPE
 * }
 */
export const TRACK_CREATE_ERROR = Symbol('TRACK_CREATE_ERROR');

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
