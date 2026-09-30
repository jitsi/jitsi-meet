/**
 * A stripped-down model of the jitsi-meet web layout, enough to compute the receiver video constraints a real
 * client with a window of the given size would send. Follows react/features/filmstrip/functions.web.ts
 * (calculateResponsiveTileViewDimensions, calculateThumbnailSizeForTileView) and the constants those use; those
 * functions take the redux state, which the load-test client does not have, so they cannot be used directly.
 */

/* Constants from react/features/filmstrip/constants.ts. */
const TILE_ASPECT_RATIO = 16 / 9;
const TILE_PORTRAIT_ASPECT_RATIO = 1 / 1.3;
const TILE_MIN_HEIGHT_SMALL = 150;
const TILE_MIN_HEIGHT_LARGE = 200;
const ASPECT_RATIO_BREAKPOINT = 500;
const TILE_VERTICAL_MARGIN = 4;
const TILE_HORIZONTAL_MARGIN = 4;
const TILE_VIEW_GRID_VERTICAL_MARGIN = 14;
const TILE_VIEW_GRID_HORIZONTAL_MARGIN = 14;
const TOOLBAR_HEIGHT = 72;
const VERTICAL_FILMSTRIP_VERTICAL_MARGIN = 26;
const DEFAULT_FILMSTRIP_WIDTH = 120;

/** The default of interfaceConfig.TILE_VIEW_MAX_COLUMNS. */
export const DEFAULT_MAX_COLUMNS = 5;

/** The default of config.tileView.numberOfVisibleTiles. */
export const DEFAULT_NUMBER_OF_VISIBLE_TILES = 25;

/** The default of config.maxFullResolutionParticipants. */
export const DEFAULT_MAX_FULL_RESOLUTION_PARTICIPANTS = 2;

/** The window size assumed when the page does not say otherwise: what the test suite runs Chrome with. */
export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 1024;

/* react/features/video-quality/constants.ts */
export const VIDEO_QUALITY_LEVELS = {
    ULTRA: 2160,
    HIGH: 720,
    STANDARD: 360,
    LOW: 180,
    NONE: 0
};

/**
 * The receive quality level for a video element of the given height: the highest level whose value fits, and at
 * least LOW. This is jitsi-meet's getReceiverVideoQualityLevel with the default (identity) height-to-level map;
 * config.videoQuality.minHeightForQualityLvl is not emulated.
 *
 * @param {number} height - The height of the element in pixels.
 * @returns {number} The quality level.
 */
export function qualityForHeight(height: number): number {
    let selected = VIDEO_QUALITY_LEVELS.LOW;

    for (const level of [ VIDEO_QUALITY_LEVELS.LOW, VIDEO_QUALITY_LEVELS.STANDARD, VIDEO_QUALITY_LEVELS.HIGH,
        VIDEO_QUALITY_LEVELS.ULTRA ]) {
        if (height >= level) {
            selected = level;
        }
    }

    return selected;
}

interface ITileSize {
    height: number;
    maxVisibleRows: number;
    minHeightEnforced: boolean;
    width: number;
}

/**
 * The size of a tile for a grid of the given columns and rows; calculateThumbnailSizeForTileView with responsive
 * tiles and tile enlargement enabled (the defaults).
 *
 * @param {number} columns - The number of columns.
 * @param {number} minVisibleRows - The number of rows that have to be visible.
 * @param {number} clientWidth - The width of the video area.
 * @param {number} clientHeight - The height of the video area.
 * @returns {ITileSize|undefined} The size, or undefined if that many columns cannot fit.
 */
function tileSize(
        columns: number, minVisibleRows: number, clientWidth: number, clientHeight: number): ITileSize | undefined {
    const aspectRatio = TILE_ASPECT_RATIO;
    const minHeight = clientWidth < ASPECT_RATIO_BREAKPOINT ? TILE_MIN_HEIGHT_SMALL : TILE_MIN_HEIGHT_LARGE;
    const viewWidth = clientWidth - (columns * TILE_HORIZONTAL_MARGIN) - TILE_VIEW_GRID_HORIZONTAL_MARGIN;
    const availableHeight = clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN;
    const viewHeight = availableHeight - (minVisibleRows * TILE_VERTICAL_MARGIN);
    const initialWidth = viewWidth / columns;
    let initialHeight = viewHeight / minVisibleRows;
    let minHeightEnforced = false;

    if (initialHeight < minHeight) {
        minHeightEnforced = true;
        initialHeight = minHeight;
    }

    const initialRatio = initialWidth / initialHeight;
    let height = initialHeight;
    let width;

    if (initialRatio > aspectRatio) {
        width = initialHeight * aspectRatio;
    } else if (initialRatio >= TILE_PORTRAIT_ASPECT_RATIO) {
        width = initialWidth;
    } else if (!minHeightEnforced) {
        height = initialWidth / TILE_PORTRAIT_ASPECT_RATIO;

        if (height >= minHeight) {
            width = initialWidth;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }

    return {
        height,
        width,
        minHeightEnforced,
        maxVisibleRows: Math.floor(availableHeight / (height + TILE_VERTICAL_MARGIN))
    };
}

/**
 * The height of the tiles in tile view for the given number of participants (local included), following
 * calculateResponsiveTileViewDimensions: the grid with the biggest total visible area wins.
 *
 * @param {number} numberOfParticipants - The number of participants, local included.
 * @param {number} clientWidth - The width of the window.
 * @param {number} clientHeight - The height of the window.
 * @param {number} maxColumns - The maximum number of columns.
 * @param {number} desiredNumberOfVisibleTiles - How many tiles should be visible without scrolling.
 * @returns {number} The tile height in pixels.
 */
export function tileViewTileHeight( // eslint-disable-line max-params
        numberOfParticipants: number,
        clientWidth: number,
        clientHeight: number,
        maxColumns = DEFAULT_MAX_COLUMNS,
        desiredNumberOfVisibleTiles = DEFAULT_NUMBER_OF_VISIBLE_TILES): number {
    interface IDimensions {
        height?: number;
        maxArea: number;
        numberOfVisibleParticipants?: number;
    }

    let dimensions: IDimensions = { maxArea: 0 };
    let minHeightEnforcedDimensions: IDimensions = { maxArea: 0 };
    let zeroVisibleRowsDimensions: IDimensions = { maxArea: 0 };

    for (let c = 1; c <= Math.min(maxColumns, numberOfParticipants, desiredNumberOfVisibleTiles); c++) {
        const r = Math.ceil(numberOfParticipants / c);
        const visibleRows
            = numberOfParticipants <= desiredNumberOfVisibleTiles ? r : Math.floor(desiredNumberOfVisibleTiles / c);
        const size = tileSize(c, visibleRows, clientWidth, clientHeight);

        if (!size) {
            continue;
        }

        const { height, width, minHeightEnforced, maxVisibleRows } = size;
        const numberOfVisibleParticipants = Math.min(c * maxVisibleRows, numberOfParticipants);
        let area = Math.round((height + TILE_VERTICAL_MARGIN) * (width + TILE_HORIZONTAL_MARGIN)
            * numberOfVisibleParticipants);
        const current: IDimensions = { maxArea: area, height, numberOfVisibleParticipants };
        const { numberOfVisibleParticipants: oldNumberOfVisibleParticipants = 0 } = dimensions;

        if (!minHeightEnforced) {
            if (area > dimensions.maxArea) {
                dimensions = current;
            } else if (area === dimensions.maxArea
                && ((oldNumberOfVisibleParticipants > desiredNumberOfVisibleTiles
                        && oldNumberOfVisibleParticipants >= numberOfParticipants)
                    || (oldNumberOfVisibleParticipants < numberOfParticipants
                        && numberOfVisibleParticipants <= desiredNumberOfVisibleTiles))) {
                dimensions = current;
            }
        } else if (area >= minHeightEnforcedDimensions.maxArea) {
            minHeightEnforcedDimensions = current;
        } else if (maxVisibleRows === 0) {
            area = height * width * Math.min(c, numberOfParticipants);
            if (area > zeroVisibleRowsDimensions.maxArea) {
                zeroVisibleRowsDimensions = { ...current, maxArea: area };
            }
        }
    }

    const chosen = [ dimensions, minHeightEnforcedDimensions, zeroVisibleRowsDimensions ].find(d => d.maxArea > 0);

    return chosen?.height ?? (clientWidth < ASPECT_RATIO_BREAKPOINT ? TILE_MIN_HEIGHT_SMALL : TILE_MIN_HEIGHT_LARGE);
}

/**
 * How many remote thumbnails fit in the vertical filmstrip of stage view without scrolling, at the default
 * filmstrip width, leaving room for the local thumbnail.
 *
 * @param {number} clientHeight - The height of the window.
 * @returns {number} The number of visible remote thumbnails.
 */
export function verticalFilmstripVisibleCount(clientHeight: number): number {
    const thumbnailHeight = DEFAULT_FILMSTRIP_WIDTH / TILE_ASPECT_RATIO;
    const available = clientHeight - TOOLBAR_HEIGHT - VERTICAL_FILMSTRIP_VERTICAL_MARGIN;

    return Math.max(0, Math.floor(available / (thumbnailHeight + TILE_VERTICAL_MARGIN)) - 1);
}

/**
 * The height of the large video in stage view: the window minus the toolbar.
 *
 * @param {number} clientHeight - The height of the window.
 * @returns {number} The height in pixels.
 */
export function largeVideoHeight(clientHeight: number): number {
    return clientHeight - TOOLBAR_HEIGHT;
}
