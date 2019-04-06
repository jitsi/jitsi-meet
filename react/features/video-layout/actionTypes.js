/**
 * The type of the action which adds a screen share to the list of known active
 * screen shares being received or sent.
 *
 * @returns {{
 *     type: SCREEN_SHARE_STREAM_ADDED,
 *     participantId: string
 * }}
 */
export const SCREEN_SHARE_STREAM_ADDED = 'SCREEN_SHARE_STREAM_ADDED';

/**
 * The type of the action which removes a screen share from the list of known
 * active screen shares being received or sent.
 *
 * @returns {{
 *     type: SCREEN_SHARE_STREAM_REMOVED,
 *     participantId: string
 * }}
 */
export const SCREEN_SHARE_STREAM_REMOVED = 'SCREEN_SHARE_STREAM_REMOVED';

/**
 * The type of the action which enables or disables the feature for showing
 * video thumbnails in a two-axis tile view.
 *
 * @returns {{
 *     type: SET_TILE_VIEW,
 *     enabled: boolean
 * }}
 */
export const SET_TILE_VIEW = 'SET_TILE_VIEW';
