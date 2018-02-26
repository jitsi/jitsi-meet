import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../../styles';

const HEADER_COLOR = ColorPalette.blue;

// Header height is from iOS guidelines. Also, this looks good.
const HEADER_HEIGHT = 44;

export const HEADER_PADDING = BoxModel.padding;
export const STATUSBAR_COLOR = ColorPalette.blueHighlight;
export const SIDEBAR_WIDTH = 250;

/**
 * The styles of the generic React {@code Components} of the app.
 */
export default createStyleSheet({

    /**
     * Platform specific header button (e.g. back, menu...etc).
     */
    headerButton: {
        alignSelf: 'center',
        color: ColorPalette.white,
        fontSize: 26,
        paddingRight: 22
    },

    /**
     * Style of the header overlay to cover the unsafe areas.
     */
    headerOverlay: {
        backgroundColor: HEADER_COLOR
    },

    /**
     * Generic style for a label placed in the header.
     */
    headerText: {
        color: ColorPalette.white,
        fontSize: 20
    },

    /**
     * The top-level element of a page.
     */
    page: {
        alignItems: 'stretch',
        bottom: 0,
        flex: 1,
        flexDirection: 'column',
        left: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * Base style of Header
     */
    screenHeader: {
        alignItems: 'center',
        backgroundColor: HEADER_COLOR,
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        justifyContent: 'flex-start',
        padding: HEADER_PADDING
    },

    /**
     * The topmost container of the side bar.
     */
    sideMenuContainer: {
        bottom: 0,
        flexDirection: 'row',
        left: -SIDEBAR_WIDTH,
        position: 'absolute',
        top: 0,
        width: SIDEBAR_WIDTH
    },

    /**
     * The container of the actual content of the side menu.
     */
    sideMenuContent: {
        width: SIDEBAR_WIDTH
    },

    /**
     * The opaque area that covers the rest of the scren, when
     * the side bar is open.
     */
    sideMenuShadow: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1
    },

    /**
     * The touchable area of the rest of the screen that closes the side bar
     * when tapped.
     */
    sideMenuShadowTouchable: {
        flex: 1
    }
});
