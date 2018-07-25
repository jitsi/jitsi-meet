/**
 * An enumeration of the different display layouts supported by the application.
 *
 * @type {Object}
 */
export const LAYOUTS = {
    HORIZONTAL_FILMSTRIP_VIEW: 'horizonta-filmstrip-view',
    TILE_VIEW: 'tile-view',
    VERTICAL_FILMSTRIP_VIEW: 'vertical-filmstrip-view'
};

/**
 * Constants used for calculating how to display the thumbnails in tile view.
 *
 * @type {Object}
 */
export const TILE_VIEW_CONFIGURATION = {
    // How much total white space is expected at the top and bottom of the
    // container that holds the tiles.
    END_MARGINS: 100 * 2,

    // The maximum number of thumbnails that should display in one row of tile
    // view.
    MAX_COLUMNS: 5,

    // How much total white space is expected at the sides of the container that
    // holds the tiles.
    SIDE_MARGINS: 10 * 2
};
