/**
 * Action to select the participant to be displayed in LargeVideo.
 *
 * {
 *     type: SELECT_LARGE_VIDEO_PARTICIPANT,
 *     participantId: (string|undefined)
 * }
 */
export const SELECT_LARGE_VIDEO_PARTICIPANT
    = 'SELECT_LARGE_VIDEO_PARTICIPANT';

/**
 * Action to update the redux store with the current resolution of large video.
 *
 * @returns {{
 *     type: UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
 *     resolution: number
 * }}
 */
export const UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION
    = 'UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION';

/**
 * Action to update the redux store with the current media event name of large video.
 *
 * @returns {{
 *     type: UPDATE_LAST_LARGE_VIDEO_MEDIA_EVENT,
 *     name: string
 * }}
 */
export const UPDATE_LAST_LARGE_VIDEO_MEDIA_EVENT
    = 'UPDATE_LAST_LARGE_VIDEO_MEDIA_EVENT';
