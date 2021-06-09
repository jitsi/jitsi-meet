/**
 * The type of the action which sets the list of known remote participant IDs which
 * have an active screen share.
 *
 * @returns {{
 *     type: SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
 *     participantIds: Array<string>
 * }}
 */
export const SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED
    = 'SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED';

/**
 * The type of the action which sets the list of the endpoints to be selected for video forwarding
 * from the bridge.
 */
export const SELECT_ENDPOINTS = 'SELECT_ENDPOINTS';

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
