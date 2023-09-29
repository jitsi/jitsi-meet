import { createStyleSheet } from '../../../../base/styles/functions.native';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * Opacity of the TouchableHighlight.
 */
export const ACTIVE_OPACITY = 0.3;

/**
 * Underlay of the TouchableHighlight.
 */
export const TOUCHABLE_UNDERLAY = BaseTheme.palette.ui06;

/**
 * The styles of the React {@code Components} of LiveStream.
 */
export default createStyleSheet({

    /**
     * Generic component to wrap form sections into achieving a unified look.
     */
    formWrapper: {
        alignItems: 'stretch',
        flexDirection: 'column',
        paddingHorizontal: BaseTheme.spacing[2]
    },

    formValidationItem: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        height: BaseTheme.spacing[4],
        marginTop: BaseTheme.spacing[2]
    },

    formButtonsWrapper: {
        alignSelf: 'center',
        display: 'flex',
        maxWidth: 200
    },

    buttonLabelStyle: {
        color: BaseTheme.palette.link01
    },

    /**
     * Explaining text on the top of the sign in form.
     */
    helpText: {
        marginBottom: BaseTheme.spacing[2]
    },

    /**
     * Container for the live stream screen.
     */
    startLiveStreamContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        paddingHorizontal: BaseTheme.spacing[2],
        paddingVertical: BaseTheme.spacing[3]
    },

    /**
     * Helper link text.
     */
    streamKeyHelp: {
        alignSelf: 'flex-end'
    },

    /**
     * Input field to manually enter stream key.
     */
    streamKeyInput: {
        alignSelf: 'stretch',
        color: BaseTheme.palette.text01,
        textAlign: 'left'
    },

    streamKeyContainer: {
        marginTop: BaseTheme.spacing[3]
    },

    /**
     * Custom component to pick a broadcast from the list fetched from Google.
     */
    streamKeyPicker: {
        alignSelf: 'stretch',
        flex: 1,
        height: 40,
        marginHorizontal: BaseTheme.spacing[1],
        width: 300
    },

    /**
     * CTA (label) of the picker.
     */
    streamKeyPickerCta: {
        marginBottom: BaseTheme.spacing[2]
    },

    /**
     * Style of a single item in the list.
     */
    streamKeyPickerItem: {
        padding: BaseTheme.spacing[1]
    },

    /**
     * Additional style for the selected item.
     */
    streamKeyPickerItemHighlight: {
        backgroundColor: BaseTheme.palette.ui04
    },

    /**
     * Overall wrapper for the picker.
     */
    streamKeyPickerWrapper: {
        borderColor: BaseTheme.palette.ui07,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 1,
        flexDirection: 'column'
    },

    /**
     * Terms and Conditions texts.
     */
    tcText: {
        textAlign: 'right'
    },

    text: {
        color: BaseTheme.palette.text01,
        fontSize: 14,
        textAlign: 'left'
    },

    /**
     * A different colored text to indicate information needing attention.
     */
    warningText: {
        color: BaseTheme.palette.warning02
    }
});
