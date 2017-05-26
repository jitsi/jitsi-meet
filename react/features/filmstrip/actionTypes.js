/**
 * The type of action which signals to change the visibility of remote videos in
 * the filmstrip.
 *
 * {
 *     type: SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
 *     remoteVideosVisible: boolean
 * }
 */
export const SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY
    = Symbol('SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY');

/**
 * The type of action sets the visibility of the entire filmstrip;
 *
 * {
 *     type: SET_FILMSTRIP_VISIBILITY,
 *     visible: boolean
 * }
 */
export const SET_FILMSTRIP_VISIBILITY = Symbol('SET_FILMSTRIP_VISIBILITY');
