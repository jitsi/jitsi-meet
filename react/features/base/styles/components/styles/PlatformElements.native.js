import { ColorPalette } from './ColorPalette';
import { BoxModel } from './BoxModel';

import {
    createStyleSheet
} from '../../functions';

export const PlatformElements = createStyleSheet({

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
     * Generic style for a label placed in the header.
     */
    headerText: {
        color: ColorPalette.white,
        fontSize: 20
    },

    /**
     * An empty padded view to place components.
     */
    paddedView: {
        padding: BoxModel.padding
    },

    /**
     * The topmost level element of a page.
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
    }
});
