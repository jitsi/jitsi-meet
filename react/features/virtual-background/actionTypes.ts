// @flow

/**
 * The type of redux action dispatched which represents that the background
 * effect is enabled or not.
 *
 * @returns {{
 *     type: BACKGROUND_ENABLED,
 *     backgroundEffectEnabled: boolean
 * }}
 */
export const BACKGROUND_ENABLED = 'BACKGROUND_ENABLED';

/**
 * The type of the action which enables or disables virtual background
 *
 * @returns {{
 *     type: SET_VIRTUAL_BACKGROUND,
 *     virtualSource: string,
 *     blurValue: number,
 *     backgroundType: string,
 *     selectedThumbnail: string
 * }}
 */
export const SET_VIRTUAL_BACKGROUND = 'SET_VIRTUAL_BACKGROUND';

/**
 * The type which signals if the local track was changed due to a changes of the virtual background.
 *
 * @returns {{
 *     type: VIRTUAL_BACKGROUND_TRACK_CHANGED
 *}}
 */

export const VIRTUAL_BACKGROUND_TRACK_CHANGED = 'VIRTUAL_BACKGROUND_TRACK_CHANGED';
