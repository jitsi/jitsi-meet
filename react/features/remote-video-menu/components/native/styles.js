// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';

export default createStyleSheet({
    participantNameContainer: {
        alignItems: 'center',
        borderBottomColor: ColorPalette.darkGrey,
        borderBottomWidth: 1,
        flexDirection: 'row',
        height: 48
    },

    participantNameLabel: {
        color: ColorPalette.lightGrey,
        flexShrink: 1,
        fontSize: 16,
        opacity: 0.90
    }
});
