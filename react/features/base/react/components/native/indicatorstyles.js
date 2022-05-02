// @flow

import { ColorPalette } from '../../../styles';

export default {

    /**
     * Base indicator style.
     */
    indicator: {
        backgroundColor: ColorPalette.transparent,
        padding: 2,
        color: ColorPalette.white,
        fontSize: 16,
        textShadowColor: ColorPalette.black,
        textShadowOffset: {
            height: -1,
            width: 0
        }
    }
};
