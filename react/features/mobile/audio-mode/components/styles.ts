import { MD_ITEM_HEIGHT } from '../../../base/dialog/components/native/styles';
import { createStyleSheet } from '../../../base/styles/functions.any';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

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
        height: MD_ITEM_HEIGHT,
        marginLeft: BaseTheme.spacing[3]
    },

    /**
     * Style for the {@code Icon} element in a row.
     */
    deviceIcon: {
        color: BaseTheme.palette.icon01,
        fontSize: BaseTheme.spacing[4]
    },

    /**
     * Style for the {@code Text} element in a row.
     */
    deviceText: {
        color: BaseTheme.palette.text01,
        fontSize: 16,
        marginLeft: BaseTheme.spacing[5]
    },

    /**
     * Style for a row which is marked as selected.
     */
    selectedText: {
        color: BaseTheme.palette.action01
    }
});
