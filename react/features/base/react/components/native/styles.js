import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../../styles';

const HEADER_COLOR = ColorPalette.blue;

// Header height is from iOS guidelines. Also, this looks good.
const HEADER_HEIGHT = 44;
const HEADER_PADDING = BoxModel.padding;

export const STATUSBAR_COLOR = ColorPalette.blueHighlight;

/**
 * The styles of the React {@code Components} of the generic components
 * in the app.
 */
export default createStyleSheet({

    /**
     * Style of the header overlay to cover the unsafe areas.
     */
    headerOverlay: {
        backgroundColor: HEADER_COLOR
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
    }
});
