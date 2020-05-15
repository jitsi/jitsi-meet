/**
 * The application's definition of the default color black.
 */
const BLACK = '#111111';

/**
 * The application's color palette.
 */
export const ColorPalette = {
    /**
     * The application's background color.
     */
    appBackground: '#FFFFFF',

    /**
     * The application's definition of the default color black. Generally,
     * expected to be kept in sync with the application's background color for
     * the sake of consistency.
     */
    black: BLACK,
    blackBlue: 'rgb(0, 3, 6)',
    blue: '#17A0DB',
    blueHighlight: '#1081b2',
    buttonUnderlay: '#495258',
    darkGrey: '#737373',
    green: '#40b183',
    lightGrey: '#AAAAAA',
    overflowMenuItemUnderlay: '#EEEEEE',
    red: '#D00000',
    transparent: 'rgba(0, 0, 0, 0)',
    warning: 'rgb(215, 121, 118)',
    white: '#FFFFFF',

    AdfcBlue: '#004b7c',
    AdfcOrange: '#ee7f00',
    AdfcTextColor: '#36454d',
    
    AdfcLightGrey: '#F2F2F2',
    AdfcGrey: '#EBEBEB',
    AdfcDarkGrey: '#737373',
    AdfcBackgroundColor: '#FFFFFF',

    AdfcFooterColor: '#737373',

    /**
     * These are colors from the atlaskit to be used on mobile, when needed.
     *
     * FIXME: Maybe a better solution would be good, or a native packaging of
     * the respective atlaskit components.
     */
    G400: '#00875A', // Slime
    N500: '#42526E', // McFanning
    R400: '#DE350B', // Red dirt
    Y200: '#FFC400' // Pub mix
};
