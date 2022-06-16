// @flow

import { BoxModel, createStyleSheet } from '../../../../base/styles';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * Opacity of the TouchableHighlight.
 */
export const ACTIVE_OPACITY = 0.3;

/**
 * Color for the key input field placeholder.
 */
export const PLACEHOLDER_COLOR = BaseTheme.palette.text03;

/**
 * Underlay of the TouchableHighlight.
 */
export const TOUCHABLE_UNDERLAY = BaseTheme.palette.action03Focus;

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
        padding: BoxModel.padding
    },

    /**
     * Wrapper for the last element in the form.
     */
    formFooter: {
        flexDirection: 'row'
    },

    /**
     * Wrapper for individual children in the last element of the form.
     */
    formFooterItem: {
        flex: 1
    },

    /**
     * Explaining text on the top of the sign in form.
     */
    helpText: {
        marginBottom: BoxModel.margin
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
        paddingTop: BaseTheme.spacing[3]
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
        borderColor: BaseTheme.palette.border02,
        borderBottomWidth: 1,
        color: BaseTheme.palette.text01,
        fontSize: 14,
        height: 40,
        marginBottom: 5,
        textAlign: 'left'
    },

    /**
     * Label for the previous field.
     */
    streamKeyInputLabel: {
        alignSelf: 'flex-start'
    },

    /**
     * Custom component to pick a broadcast from the list fetched from Google.
     */
    streamKeyPicker: {
        alignSelf: 'stretch',
        flex: 1,
        height: 40,
        marginHorizontal: 4,
        width: 300
    },

    /**
     * CTA (label) of the picker.
     */
    streamKeyPickerCta: {
        marginBottom: 8
    },

    /**
     * Style of a single item in the list.
     */
    streamKeyPickerItem: {
        padding: 4
    },

    /**
     * Additional style for the selected item.
     */
    streamKeyPickerItemHighlight: {
        backgroundColor: BaseTheme.palette.ui13
    },

    /**
     * Overall wrapper for the picker.
     */
    streamKeyPickerWrapper: {
        borderColor: BaseTheme.palette.dividerColor,
        borderRadius: 3,
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
