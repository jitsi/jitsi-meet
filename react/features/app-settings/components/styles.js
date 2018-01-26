import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../base/styles';

export const ANDROID_UNDERLINE_COLOR = 'transparent';
export const CONTAINER_PADDING = 2 * BoxModel.padding;
export const HEADER_COLOR = ColorPalette.blue;
export const HEADER_PADDING = BoxModel.padding;
const TEXT_SIZE = 17;

/**
 * The styles of the React {@code Components} of the feature
 * {@code app-settings}.
 */
export default createStyleSheet({

    /**
     * The back button style.
     */
    backIcon: {
        alignSelf: 'center',
        fontSize: 26,
        padding: 8,
        paddingRight: 22
    },

    /**
     * Standardized style for a field container {@code View}.
     */
    fieldContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        minHeight: 65
    },

    /**
     * Standard container for a {@code View} containing a field label.
     */
    fieldLabelContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        marginRight: 5
    },

    /**
     * Field container style for all but last row {@code View}.
     */
    fieldSeparator: {
        borderBottomWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)'
    },

    /**
     * Style for the {@code View} containing each
     * field values (the actual field).
     */
    fieldValueContainer: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },

    formSectionTitle: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginTop: 5,
        padding: 5
    },

    /**
     * Page header {@code View}.
     */
    headerContainer: {
        alignItems: 'center',
        backgroundColor: HEADER_COLOR,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: HEADER_PADDING
    },

    /**
     * The title {@code Text} of the header.
     */
    headerTitle: {
        color: ColorPalette.white,
        fontSize: 22
    },

    /**
     * Style of the ScrollView to be able to scroll the content.
     */
    scrollView: {
        flex: 1
    },

    /**
     * The back button style on the settings screen.
     */
    settingsBackButton: {
        color: ColorPalette.white
    },

    /**
     * The top level container {@code View}.
     */
    settingsContainer: {
        backgroundColor: ColorPalette.white,
        flex: 1,
        flexDirection: 'column',
        margin: 0,
        padding: CONTAINER_PADDING,
        paddingTop: 0
    },

    /**
     * Global {@code Text} color for the page.
     */
    text: {
        color: ColorPalette.black,
        fontSize: TEXT_SIZE
    },

    /**
     * Standard text input field style.
     */
    textInputField: {
        flex: 1,
        fontSize: TEXT_SIZE,
        textAlign: 'right'
    }
});
