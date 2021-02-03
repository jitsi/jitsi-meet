// @flow

/**
 * The height of the filmstrip in narrow aspect ratio, or width in wide.
 */
export const FILMSTRIP_SIZE = 90;

/**
 * The aspect ratio of a tile in tile view.
 */
export const TILE_ASPECT_RATIO = 16 / 9;

/**
 * The aspect ratio of a square tile in tile view.
 */
export const SQUARE_TILE_ASPECT_RATIO = 1;

/**
 * Width below which the overflow menu(s) will be displayed as drawer(s).
 */
export const DISPLAY_DRAWER_THRESHOLD = 512;

/**
 * Breakpoint past which a single column view is enforced in tile view.
 */
export const SINGLE_COLUMN_BREAKPOINT = 300;

/**
 * Breakpoint past which a two column view is enforced in tile view.
 */
export const TWO_COLUMN_BREAKPOINT = 1000;

/**
 * Breakpoint past which the aspect ratio is switched in tile view.
 * Also, past this breakpoint, if there are two participants in the conference, we enforce
 * single column view.
 * If this is to be modified, please also change the related media query from the tile_view scss file.
 */
export const ASPECT_RATIO_BREAKPOINT = 500;

/**
 * The default number of columns for tile view.
 */
export const DEFAULT_MAX_COLUMNS = 5;

/**
 * An extended number of columns for tile view.
 */
export const ABSOLUTE_MAX_COLUMNS = 7;
