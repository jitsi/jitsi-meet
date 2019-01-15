// @flow

import { MD_ITEM_HEIGHT } from '../../../base/dialog';
import { ColorPalette, createStyleSheet } from '../../../base/styles';

/**
 * The React {@code Component} styles of {@code AudioRoutePickerDialog}.
 *
 * It uses a {@code BottomSheet} and these have been implemented as per the
 * Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export default createStyleSheet({
    /**
     * Base style for each row.
     */
    deviceRow: {
        alignItems: 'center',
        flexDirection: 'row',
        height: MD_ITEM_HEIGHT
    },

    /**
     * Style for the {@code Icon} element in a row.
     */
    deviceIcon: {
        color: ColorPalette.white,
        fontSize: 24
    },

    /**
     * Style for the {@code Text} element in a row.
     */
    deviceText: {
        color: ColorPalette.white,
        fontSize: 16,
        marginLeft: 32
    },

    /**
     * Style for a row which is marked as selected.
     */
    selectedText: {
        color: ColorPalette.blue
    }
});
