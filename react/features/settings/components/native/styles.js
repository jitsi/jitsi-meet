import { ColorPalette } from '../../../base/styles';

export const ANDROID_UNDERLINE_COLOR = 'transparent';
export const PLACEHOLDER_COLOR = ColorPalette.lightGrey;

const TEXT_SIZE = 17;

/**
 * The styles of the native components of the feature {@code settings}.
 */
export default {
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
     * * Appended style for column layout fields.
     */
    fieldContainerColumn: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        paddingVertical: 3
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
     * Appended style for column layout fields.
     */
    fieldLabelTextColumn: {
        fontSize: 12
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
     * Style for the form section separator titles.
     */
    formSectionTitle: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: 5
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
        color: ColorPalette.black,
        flex: 1,
        fontSize: TEXT_SIZE,
        textAlign: 'right'
    },

    /**
     * Appended style for column layout fields.
     */
    textInputFieldColumn: {
        backgroundColor: 'rgb(245, 245, 245)',
        borderRadius: 8,
        marginVertical: 5,
        paddingVertical: 3,
        textAlign: 'left'
    }
};
