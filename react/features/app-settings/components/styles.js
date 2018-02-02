import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../base/styles';

/**
 * The styles of the React {@code Components} of the feature
 * {@code app-settings}.
 */
export default createStyleSheet({
    /**
     * Style of the ScrollView to be able to scroll the content.
     */
    scrollView: {
        flex: 1
    },

    /**
     * Style of the settings screen content (form).
     */
    settingsForm: {
        flex: 1,
        margin: BoxModel.margin
    },

    /**
     * Global {@code Text} color for the page.
     */
    text: {
        color: ColorPalette.black
    }
});
