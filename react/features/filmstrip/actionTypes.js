/**
 * The type of (redux) action which sets whether the filmstrip is enabled.
 *
 * {
 *     type: SET_FILMSTRIP_ENABLED,
 *     enabled: boolean
 * }
 */
export const SET_FILMSTRIP_ENABLED = 'SET_FILMSTRIP_ENABLED';

/**
 * The type of (redux) action which sets whether the filmstrip is visible.
 *
 * {
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_FILMSTRIP_VISIBLE = 'SET_FILMSTRIP_VISIBLE';

/**
 * The type of (redux) action which sets the dimensions of the tile view grid.
 *
 * {
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: {
 *         gridDimensions: {
 *             columns: number,
 *             height: number,
 *             minVisibleRows: number,
 *             width: number
 *         },
 *         thumbnailSize: {
 *             height: number,
 *             width: number
 *         },
 *         filmstripWidth: number
 *     }
 * }
 */
export const SET_TILE_VIEW_DIMENSIONS = 'SET_TILE_VIEW_DIMENSIONS';

/**
 * The type of (redux) action which sets the dimensions of the thumbnails in horizontal view.
 *
 * {
 *     type: SET_HORIZONTAL_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }
 */
export const SET_HORIZONTAL_VIEW_DIMENSIONS = 'SET_HORIZONTAL_VIEW_DIMENSIONS';

/**
 * The type of (redux) action which sets the dimensions of the thumbnails in vertical view.
 *
 * {
 *     type: SET_VERTICAL_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }
 */
export const SET_VERTICAL_VIEW_DIMENSIONS = 'SET_VERTICAL_VIEW_DIMENSIONS';

/**
 * The type of (redux) action which sets the volume for a thumnail's audio.
 *
 * {
 *     type: SET_VOLUME,
 *     participantId: string,
 *     volume: number
 * }
 */
export const SET_VOLUME = 'SET_VOLUME';

/**
 * The type of the action which sets the list of visible remote participants in the filmstrip by storing the start and
 * end index in the remote participants array.
 *
 * {
 *      type: SET_VISIBLE_REMOTE_PARTICIPANTS,
 *      startIndex: number,
 *      endIndex: number
 * }
 */
export const SET_VISIBLE_REMOTE_PARTICIPANTS = 'SET_VISIBLE_REMOTE_PARTICIPANTS';
