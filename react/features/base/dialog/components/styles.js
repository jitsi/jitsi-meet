import { ColorPalette, createStyleSheet } from '../../styles';

/**
 * The React <tt>Component</tt> styles of the feature base/dialog.
 */
export default createStyleSheet({
    /**
     * The style of the <tt>Text</tt> in a <tt>Dialog</tt> button.
     */
    buttonText: {
        color: ColorPalette.blue
    },

    /**
     * The style of the <tt>Text</tt> in a <tt>Dialog</tt> button which is
     * disabled.
     */
    disabledButtonText: {
        color: ColorPalette.darkGrey
    }
});
