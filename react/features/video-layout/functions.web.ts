import { IReduxState } from '../app/types';
import {
    ABSOLUTE_MAX_COLUMNS,
    DEFAULT_MAX_COLUMNS,
    TILE_PORTRAIT_ASPECT_RATIO
} from '../filmstrip/constants';
import {
    getNumberOfPartipantsForTileView,
    getThumbnailMinHeight,
    getTileDefaultAspectRatio
} from '../filmstrip/functions.web';

export * from './functions.any';

/**
 * Returns how many columns should be displayed in tile view. The number
 * returned will be between 1 and 7, inclusive.
 *
 * @param {Object} state - The redux store state.
 * @param {Object} options - Object with custom values used to override the values that we get from redux by default.
 * @param {number} options.width - Custom width to be used.
 * @param {boolean} options.disableResponsiveTiles - Custom value to be used instead of config.disableResponsiveTiles.
 * @param {boolean} options.disableTileEnlargement - Custom value to be used instead of config.disableTileEnlargement.
 * @returns {number}
 */
export function getMaxColumnCount(state: IReduxState, options: {
    disableResponsiveTiles?: boolean; disableTileEnlargement?: boolean; width?: number | null; } = {}) {
    if (typeof interfaceConfig === 'undefined') {
        return DEFAULT_MAX_COLUMNS;
    }

    const {
        disableResponsiveTiles: configDisableResponsiveTiles,
        disableTileEnlargement: configDisableTileEnlargement
    } = state['features/base/config'];
    const {
        width,
        disableResponsiveTiles = configDisableResponsiveTiles,
        disableTileEnlargement = configDisableTileEnlargement
    } = options;
    const { clientWidth } = state['features/base/responsive-ui'];
    const widthToUse = width || clientWidth;
    const configuredMax = interfaceConfig.TILE_VIEW_MAX_COLUMNS;

    if (disableResponsiveTiles) {
        return Math.min(Math.max(configuredMax || DEFAULT_MAX_COLUMNS, 1), ABSOLUTE_MAX_COLUMNS);
    }

    if (typeof interfaceConfig.TILE_VIEW_MAX_COLUMNS !== 'undefined' && interfaceConfig.TILE_VIEW_MAX_COLUMNS > 0) {
        return Math.max(configuredMax, 1);
    }

    const aspectRatio = disableTileEnlargement
        ? getTileDefaultAspectRatio(true, disableTileEnlargement, widthToUse)
        : TILE_PORTRAIT_ASPECT_RATIO;
    const minHeight = getThumbnailMinHeight(widthToUse);
    const minWidth = aspectRatio * minHeight;

    return Math.floor(widthToUse / minWidth);
}

/**
 * Returns the cell count dimensions for tile view. Tile view tries to uphold
 * equal count of tiles for height and width, until maxColumn is reached in
 * which rows will be added but no more columns.
 *
 * @param {Object} state - The redux store state.
 * @param {boolean} stageFilmstrip - Whether the dimensions should be calculated for the stage filmstrip.
 * @returns {Object} An object is return with the desired number of columns,
 * rows, and visible rows (the rest should overflow) for the tile view layout.
 */
export function getNotResponsiveTileViewGridDimensions(state: IReduxState, stageFilmstrip = false) {
    const maxColumns = getMaxColumnCount(state);
    const { activeParticipants } = state['features/filmstrip'];
    const numberOfParticipants = stageFilmstrip ? activeParticipants.length : getNumberOfPartipantsForTileView(state);
    const columnsToMaintainASquare = Math.ceil(Math.sqrt(numberOfParticipants));
    const columns = Math.min(columnsToMaintainASquare, maxColumns);
    const rows = Math.ceil(numberOfParticipants / columns);
    const minVisibleRows = Math.min(maxColumns, rows);

    return {
        columns,
        minVisibleRows,
        rows
    };
}
