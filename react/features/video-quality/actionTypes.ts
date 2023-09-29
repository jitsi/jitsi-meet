/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants for the large video, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO = 'SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO';



/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants for the screen sharing filmstrip, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP = 'SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP';

/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants for stage filmstrip, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP = 'SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP';

/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants for tile view, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW = 'SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW';

/**
 * The type of (redux) action which sets the maximum video height that should be
 * received from remote participants for vertical filmstrip, even if the user prefers a larger video
 * height.
 *
 * {
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }
 */
export const SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP = 'SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP';

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