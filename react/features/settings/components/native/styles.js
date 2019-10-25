import {
    ColorPalette,
    createStyleSheet
} from '../../../base/styles';

export const ANDROID_UNDERLINE_COLOR = 'transparent';
const TEXT_SIZE = 17;

/**
 * The styles of the native components of the feature {@code settings}.
 */
export default createStyleSheet({
    /**
     * Standardized style for a field container {@code View}.
     */
    fieldContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        minHeight: 65,
        paddingHorizontal: 8
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
     * Text of the field labels on the form.
     */
    fieldLabelText: {
        fontSize: TEXT_SIZE
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

    /**
     * Style fo the form section separator titles.
     */
    formSectionTitle: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: 5
    },

    settingsForm: {
        backgroundColor: ColorPalette.white,
        flex: 1
    },

    /**
     * Global {@code Text} color for the components.
     */
    text: {
        color: ColorPalette.black
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
