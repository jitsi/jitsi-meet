/**
 * The type of Redux action which sets the noSrcDataNotificationUid state representing the UID of the previous
 * no data from source notification. Used to check if such a notification was previously displayed.
 *
 * {
 *     type: SET_NO_SRC_DATA_NOTIFICATION_UID,
 *     uid: ?number
 * }
 */
export const SET_NO_SRC_DATA_NOTIFICATION_UID = 'SET_NO_SRC_DATA_NOTIFICATION_UID';

/**
 * The type of redux action dispatched to disable screensharing or to start the
 * flow for enabling screenshare.
 *
 * {
 *     type: TOGGLE_SCREENSHARING
 * }
 */
export const TOGGLE_SCREENSHARING = 'TOGGLE_SCREENSHARING';

/**
 * The type of redux action dispatched when a track has been (locally or
 * remotely) added to the conference.
 *
 * {
 *     type: TRACK_ADDED,
 *     track: Track
 * }
 */
export const TRACK_ADDED = 'TRACK_ADDED';

/**
 * The type of redux action dispatched when a canceled {@code getUserMedia}
 * process completes either successfully or with an error (the error is ignored
 * and the track is immediately disposed if it has been created).
 *
 * {
 *     type: TRACK_CREATE_CANCELED,
 *     trackType: MEDIA_TYPE
 * }
 */
export const TRACK_CREATE_CANCELED = 'TRACK_CREATE_CANCELED';

/**
 * The type of redux action dispatched when {@code getUserMedia} fails with an
 * error (such as permission denied).
 *
 * {
 *     type: TRACK_CREATE_ERROR,
 *     permissionDenied: Boolean,
 *     trackType: MEDIA_TYPE
 * }
 */
export const TRACK_CREATE_ERROR = 'TRACK_CREATE_ERROR';

/**
 * The type of redux action dispatched when a track has triggered no data from source event.
 *
 * {
 *     type: TRACK_NO_DATA_FROM_SOURCE,
 *     track: Track
 * }
 */
export const TRACK_NO_DATA_FROM_SOURCE = 'TRACK_NO_DATA_FROM_SOURCE';

/**
 * The type of redux action dispatched when a track has been (locally or
 * remotely) removed from the conference.
 *
 * {
 *     type: TRACK_REMOVED,
 *     track: Track
 * }
 */
export const TRACK_REMOVED = 'TRACK_REMOVED';

/**
 * The type of redux action dispatched when a track has stopped.
 *
 * {
 *      type: TRACK_STOPPED,
 *      track: Track
 * }
 */
export const TRACK_STOPPED = 'TRACK_STOPPED';

/**
 * The type of redux action dispatched when a track's properties were updated.
 *
 * {
 *     type: TRACK_UPDATED,
 *     track: Track
 * }
 */
export const TRACK_UPDATED = 'TRACK_UPDATED';

/**
 * The type of redux action dispatched when a local track starts being created
 * via a WebRTC {@code getUserMedia} call. The action's payload includes an
 * extra {@code gumProcess} property which is a {@code Promise} with an extra
 * {@code cancel} method which can be used to cancel the process. Canceling will
 * result in disposing any {@code JitsiLocalTrack} returned by the
 * {@code getUserMedia} callback. There will be a {@code TRACK_CREATE_CANCELED}
 * action instead of a {@code TRACK_ADDED} or {@code TRACK_CREATE_ERROR} action.
 *
 * {
 *     type: TRACK_WILL_CREATE
 *     track: {
 *         gumProcess: Promise with a `cancel` method to cancel the process,
 *         local: true,
 *         mediaType: MEDIA_TYPE
 *     }
 * }
 */
export const TRACK_WILL_CREATE = 'TRACK_WILL_CREATE';

/**
 * Action to update the redux store with the current media event name of the video track.
 *
 * @returns {{
 *     type: TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT,
 *     track: Track,
 *     name: string
 * }}
 */
export const TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT = 'TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT';
