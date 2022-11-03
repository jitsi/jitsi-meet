/**
 * An enumeration of the different display layouts supported by the application.
 *
 * @type {Object}
 */
export const LAYOUTS = {
    HORIZONTAL_FILMSTRIP_VIEW: 'horizontal-filmstrip-view',
    TILE_VIEW: 'tile-view',
    VERTICAL_FILMSTRIP_VIEW: 'vertical-filmstrip-view',
    STAGE_FILMSTRIP_VIEW: 'stage-filmstrip-view'
};


/**
 * The CSS class to apply so CSS can modify the app layout.
 *
 * @private
 */
export const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip',
    [LAYOUTS.STAGE_FILMSTRIP_VIEW]: 'stage-filmstrip'
};
