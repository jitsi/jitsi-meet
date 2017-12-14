import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../base/styles';

const LABEL_TAB = 300;

export const ANDROID_UNDERLINE_COLOR = 'transparent';

/**
 * The styles of the React {@code Components} of the feature welcome including
 * {@code WelcomePage} and {@code BlankPage}.
 */
export default createStyleSheet({

    /**
    * Standardized style for a field container {@code View}.
    */
    fieldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 65
    },

    /**
    * Standard container for a {@code View} containing a field label.
    */
    fieldLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: LABEL_TAB
    },

    /**
    * Field container style for all but last row {@code View}.
    */
    fieldSeparator: {
        borderBottomWidth: 1
    },

    /**
    * Style for the {@code View} containing each
    * field values (the actual field).
    */
    fieldValueContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center'
    },

    /**
    * Page header {@code View}.
    */
    headerContainer: {
        backgroundColor: ColorPalette.blue,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 2 * BoxModel.margin
    },

    /**
    * The title {@code Text} of the header.
    */
    headerTitle: {
        color: ColorPalette.white,
        fontSize: 25
    },

    /**
    * The top level container {@code View}.
    */
    settingsContainer: {
        backgroundColor: ColorPalette.white,
        flex: 1,
        flexDirection: 'column',
        margin: 0,
        padding: 2 * BoxModel.padding
    },

    /**
    * Global {@code Text} color for the page.
    */
    text: {
        color: ColorPalette.black,
        fontSize: 20
    },

    /**
    * Standard text input field style.
    */
    textInputField: {
        fontSize: 20,
        flex: 1,
        textAlign: 'right'
    }
});
