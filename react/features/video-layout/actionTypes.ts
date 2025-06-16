/**
 * The type of the action which tells whether we are in carmode.
 *
 * @returns {{
 *     type: SET_CAR_MODE,
 *     enabled: boolean
 * }}
 */
export const SET_CAR_MODE = ' SET_CAR_MODE';

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

/**
 * The type of the action which sets the list of known remote virtual screen share participant IDs.
 *
 * @returns {{
 *     type: VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED,
 *     participantIds: Array<string>
 * }}
 */
export const VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED = 'VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED';
