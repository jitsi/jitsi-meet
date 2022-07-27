import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const ANDROID_UNDERLINE_COLOR = 'transparent';
export const PLACEHOLDER_COLOR = BaseTheme.palette.focus01;
export const ENABLED_TRACK_COLOR = BaseTheme.palette.switch01Enabled;
export const DISABLED_TRACK_COLOR = BaseTheme.palette.switch01Disabled;
export const THUMB_COLOR = BaseTheme.palette.field02;

const TEXT_SIZE = 14;


/**
 * The styles of the native components of the feature {@code settings}.
 */
export default {

    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        height: 180,
        justifyContent: 'center'
    },

    /**
     * The style of the display name label.
     */
    avatarLabel: {
        color: BaseTheme.palette.text01,
        fontSize: 16,
        marginTop: BoxModel.margin,
        textAlign: 'center'
    },


    /**
     * Style for screen container.
     */
    settingsViewContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    /**
     * Standardized style for a field container {@code View}.
     */
    fieldContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        minHeight: 56,
        paddingHorizontal: 8
    },

    /**
     * * Appended style for column layout fields.
     */
    fieldContainerColumn: {
        alignItems: 'flex-start',
        flexDirection: 'column'
    },

    /**
     * Standard container for a {@code View} containing a field label.
     */
    fieldLabelContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingLeft: 8
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
        borderColor: BaseTheme.palette.ui05
    },

    /**
     * Style for the {@code View} containing each
     * field values (the actual field).
     */
    fieldValueContainer: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 8
    },

    /**
     * Style for the form section separator titles.
     */
    formSectionTitle: {
        backgroundColor: BaseTheme.palette.ui02,
        paddingBottom: 0,
        paddingTop: 0
    },

    formSectionTitleText: {
        color: BaseTheme.palette.text01
    },

    section: {
        color: BaseTheme.palette.icon01,
        fontSize: 14
    },

    sectionLink: {
        ...BaseTheme.typography.bodyShortBoldLarge,
        color: BaseTheme.palette.link01,
        margin: BaseTheme.spacing[3],
        textAlign: 'center'
    },

    sectionLinkContainer: {
        margin: BaseTheme.spacing[3]
    },

    sectionLinkText: {
        ...BaseTheme.typography.bodyShortBoldLarge,
        color: BaseTheme.palette.link01,
        textAlign: 'center'
    },

    /**
     * Global {@code Text} color for the components.
     */
    text: {
        color: BaseTheme.palette.text01
    },

    /**
     * Text input container style.
     */
    textInputContainer: {
        flex: 1,
        height: BaseTheme.spacing[7],
        marginBottom: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[2]
    },

    /**
     * Standard text input field style.
     */
    textInputField: {
        color: BaseTheme.palette.field01,
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
    },

    /**
     * Style for screen container.
     */
    screenContainer: {
        flex: 1
    }
};
