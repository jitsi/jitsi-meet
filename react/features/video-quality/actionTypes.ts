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
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY = 'SET_MAX_RECEIVER_VIDEO_QUALITY';
