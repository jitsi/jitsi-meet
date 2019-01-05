// @flow

import {
    MD_FONT_SIZE,
    MD_ITEM_HEIGHT,
    MD_ITEM_MARGIN_PADDING
} from '../../../base/dialog';
import { ColorPalette, createStyleSheet } from '../../../base/styles';

export default createStyleSheet({
    participantNameContainer: {
        alignItems: 'center',
        borderBottomColor: ColorPalette.darkGrey,
        borderBottomWidth: 1,
        flexDirection: 'row',
        height: MD_ITEM_HEIGHT
    },

    participantNameLabel: {
        color: ColorPalette.lightGrey,
        flexShrink: 1,
        fontSize: MD_FONT_SIZE,
        marginLeft: MD_ITEM_MARGIN_PADDING,
        opacity: 0.90
    }
});
