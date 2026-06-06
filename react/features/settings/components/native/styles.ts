import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const ANDROID_UNDERLINE_COLOR = 'transparent';
export const PLACEHOLDER_COLOR = BaseTheme.palette.focus01;

/**
 * The styles of the native components of the feature {@code settings}.
 */
export default {

    profileContainerWrapper: {
        margin: BaseTheme.spacing[4]
    },

    profileContainer: {
        backgroundColor: BaseTheme.palette.ui02,
        borderRadius: BaseTheme.shape.borderRadius,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: BaseTheme.spacing[3]
    },

    profileView: {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },

    applyProfileSettingsButton: {
        marginHorizontal: BaseTheme.spacing[4],
        marginVertical: BaseTheme.spacing[3]
    },

    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: BaseTheme.spacing[3],
        margin: BaseTheme.spacing[4]
    },

    gavatarMessageContainer: {
        marginHorizontal: BaseTheme.spacing[4],
        color: BaseTheme.palette.text02,
        marginTop: -BaseTheme.spacing[2],
        ...BaseTheme.typography.bodyShortRegular
    },

    displayName: {
        ...BaseTheme.typography.bodyLongRegularLarge,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[3],
        position: 'relative'
    },

    profileViewArrow: {
        position: 'absolute',
        right: BaseTheme.spacing[3]
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
        minHeight: BaseTheme.spacing[8],
        paddingHorizontal: BaseTheme.spacing[2],
        justifyContent: 'space-between'
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
        flexShrink: 1,
        flexDirection: 'row',
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[1]
    },

    /**
     * Text of the field labels on the form.
     */
    fieldLabelText: {
        ...BaseTheme.typography.bodyShortRegularLarge
    },

    /**
     * Field container style for all but last row {@code View}.
     */
    fieldSeparator: {
        marginHorizontal: BaseTheme.spacing[4],
        borderBottomWidth: 1,
        borderColor: BaseTheme.palette.ui05,
        marginVertical: BaseTheme.spacing[3]
    },

    /**
     * Style for the {@code View} containing each
     * field values (the actual field).
     */
    fieldValueContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        flexShrink: 1,
        justifyContent: 'flex-end',
        paddingRight: BaseTheme.spacing[3]
    },

    /**
     * Style for the form section separator titles.
     */

    formSectionTitleContent: {
        backgroundColor: BaseTheme.palette.ui02,
        paddingVertical: BaseTheme.spacing[1]
    },

    formSectionTitleText: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text02,
        marginHorizontal: BaseTheme.spacing[4],
        marginVertical: BaseTheme.spacing[3]
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
    customContainer: {
        marginBottom: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[4],
        marginTop: BaseTheme.spacing[2]
    },

    languageButtonContainer: {
        borderRadius: BaseTheme.shape.borderRadius,
        overflow: 'hidden'
    },

    languageButton: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[7],
        justifyContent: 'center'
    },

    languageOption: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: BaseTheme.spacing[6],
        marginHorizontal: BaseTheme.spacing[4],
        borderBottomWidth: 1,
        borderColor: BaseTheme.palette.ui05
    },

    selectedLanguage: {
        color: BaseTheme.palette.text03
    },

    languageText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[2]
    },

    /**
     * Standard text input field style.
     */
    textInputField: {
        color: BaseTheme.palette.field01,
        flex: 1,
        ...BaseTheme.typography.bodyShortRegularLarge,
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
    },

    linksSection: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        marginHorizontal: BaseTheme.spacing[3]
    },

    linksButton: {
        width: '33%',
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        ...BaseTheme.typography.bodyShortBoldLarge
    },

    logBtn: {
        marginRight: BaseTheme.spacing[3]
    },

    backBtn: {
        marginLeft: BaseTheme.spacing[3]
    }
};
