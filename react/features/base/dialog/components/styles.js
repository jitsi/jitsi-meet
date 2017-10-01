import { ColorPalette, createStyleSheet } from '../../styles';

/**
 * The React {@code Component} styles of the feature base/dialog.
 */
export default createStyleSheet({
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
