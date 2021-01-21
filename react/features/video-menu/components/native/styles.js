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
        borderBottomColor: ColorPalette.lightGrey,
        borderBottomWidth: 1,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        flexDirection: 'row',
        height: MD_ITEM_HEIGHT,
        paddingLeft: MD_ITEM_MARGIN_PADDING
    },

    participantNameLabel: {
        color: ColorPalette.lightGrey,
        flexShrink: 1,
        fontSize: MD_FONT_SIZE,
        marginLeft: MD_ITEM_MARGIN_PADDING,
        opacity: 0.90
    },

    statsTitleText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 3
    },

    statsInfoText: {
        fontSize: 16,
        marginRight: 2,
        marginLeft: 2
    },

    statsInfoCell: {
        alignItems: 'center',
        flexDirection: 'row',
        height: 30,
        justifyContent: 'flex-start'
    },

    statsWrapper: {
        marginVertical: 10
    }
});
