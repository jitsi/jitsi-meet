// @flow

import { ColorPalette } from '../../../styles';

export default {
    /**
     * Highlighted indicator additional style.
     */
    highlightedIndicator: {
        backgroundColor: ColorPalette.blue,
        borderRadius: 16,
        padding: 4
    },

    /**
     * Base indicator style.
     */
    indicator: {
        backgroundColor: ColorPalette.transparent,
        color: ColorPalette.white,
        fontSize: 12,
        textShadowColor: ColorPalette.black,
        textShadowOffset: {
            height: -1,
            width: 0
        }
    }
};
