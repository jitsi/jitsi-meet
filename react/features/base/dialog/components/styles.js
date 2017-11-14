import { ColorPalette, createStyleSheet } from '../../styles';

/**
 * The React {@code Component} styles of {@code Dialog}.
 */
export const dialog = createStyleSheet({
    /**
     * The style of the {@code Text} in a {@code Dialog} button.
     */
    buttonText: {
        color: ColorPalette.blue
    },

    /**
     * The style of the {@code Text} in a {@code Dialog} button which is
     * disabled.
     */
    disabledButtonText: {
        color: ColorPalette.darkGrey
    }
});

/**
 * The React {@code Component} styles of {@code SimpleBottomSheet}. These have
 * been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export const simpleBottomSheet = createStyleSheet({
    /**
     * Style for the container of the sheet.
     */
    container: {
        flex: 1,
        flexDirection: 'row'
    },

    /**
     * Style for a backdrop overlay covering the screen while the
     */
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * Base style for each row.
     */
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        height: 48
    },

    /**
     * Style for the {@code Icon} element in a row.
     */
    rowIcon: {
        fontSize: 24
    },

    /**
     * Helper for adding some padding between the icon and text in a row.
     */
    rowPadding: {
        width: 32
    },

    /**
     * Style for a row which is marked as selected.
     */
    rowSelectedText: {
        color: ColorPalette.blue
    },

    /**
     * Style for the {@code Text} element in a row.
     */
    rowText: {
        fontSize: 16
    },

    /**
     * Wrapper for all rows, it adds a margin to the sheet container.
     */
    rowsWrapper: {
        marginHorizontal: 16,
        marginVertical: 8
    },

    /**
     * Bottom sheet's base style.
     */
    sheet: {
        alignSelf: 'flex-end',
        backgroundColor: ColorPalette.white,
        flex: 1
    }
});
