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
 * The React {@code Component} styles of {@code BottomSheet}. These have
 * been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export const bottomSheetStyles = createStyleSheet({
    /**
     * Style for a backdrop which dims the view in the background. This view
     * will also be clickable. The backgroundColor is applied to the overlay
     * view instead, so the modal animation doesn't affect the backdrop.
     */
    backdrop: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * Style for the container of the sheet.
     */
    container: {
        alignItems: 'flex-end',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    /**
     * Style for an overlay on top of which the sheet will be displayed.
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
     * Bottom sheet's base style.
     */
    sheet: {
        flex: 1,
        backgroundColor: ColorPalette.white,
        paddingHorizontal: 16,
        paddingVertical: 8
    }
});
