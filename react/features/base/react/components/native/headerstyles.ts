import { StyleSheet } from 'react-native';

import ColorSchemeRegistry from '../../../color-scheme/ColorSchemeRegistry';
import { schemeColor } from '../../../color-scheme/functions';
import { BoxModel } from '../../../styles/components/styles/BoxModel';

const HEADER_FONT_SIZE = 18;
const HEADER_HEIGHT = 48;
const HEADER_PADDING = BoxModel.padding / 2;

ColorSchemeRegistry.register('Header', {

    /**
     * Style of a disabled button in the header (e.g. Next).
     */
    disabledButtonText: {
        opacity: 0.6
    },

    /**
     * Platform specific header button (e.g. Back, menu, etc).
     */
    headerButtonIcon: {
        alignSelf: 'center',
        color: schemeColor('icon'),
        fontSize: 22,
        marginRight: 12,
        padding: 8
    },

    headerButtonText: {
        color: schemeColor('text'),
        fontSize: HEADER_FONT_SIZE
    },

    /**
     * Style of the header overlay to cover the unsafe areas.
     */
    headerOverlay: {
        backgroundColor: schemeColor('background')
    },

    /**
     * Generic style for a label placed in the header.
     */
    headerText: {
        color: schemeColor('text'),
        fontSize: HEADER_FONT_SIZE
    },

    headerTextWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0
    },

    /**
     * The top-level element of a page.
     */
    page: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'stretch',
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden'
    },

    /**
     * Base style of Header.
     */
    screenHeader: {
        alignItems: 'center',
        backgroundColor: schemeColor('background'),
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        justifyContent: 'space-between',
        paddingHorizontal: BoxModel.padding,
        paddingVertical: HEADER_PADDING
    },

    statusBar: schemeColor('statusBar'),

    statusBarContent: schemeColor('statusBarContent')
});
