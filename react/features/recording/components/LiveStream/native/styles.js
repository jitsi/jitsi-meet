// @flow

import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../../../base/styles';

/**
 * Opacity of the TouchableHighlight.
 */
export const ACTIVE_OPACITY = 0.3;

/**
 * Color for the key input field placeholder.
 */
export const PLACEHOLDER_COLOR = ColorPalette.lightGrey;

/**
 * Underlay of the TouchableHighlight.
 */
export const TOUCHABLE_UNDERLAY = ColorPalette.lightGrey;

/**
 * The styles of the React {@code Components} of LiveStream.
 */
export default createStyleSheet({
    betaTag: {
        backgroundColor: ColorPalette.darkGrey,
        borderRadius: 2,
        marginLeft: 16,
        opacity: 0.90,
        paddingLeft: 6,
        paddingRight: 6
    },

    betaTagText: {
        color: ColorPalette.white,
        fontWeight: 'bold'
    },

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
     * Wrapper for the StartLiveStreamDialog form.
     */
    startDialogWrapper: {
        flexDirection: 'column'
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
        borderColor: ColorPalette.lightGrey,
        borderBottomWidth: 1,
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
        backgroundColor: ColorPalette.darkGrey
    },

    /**
     * Overall wrapper for the picker.
     */
    streamKeyPickerWrapper: {
        borderColor: ColorPalette.lightGrey,
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
        fontSize: 14,
        textAlign: 'left'
    },

    /**
     * A different colored text to indicate information needing attention.
     */
    warningText: {
        color: ColorPalette.Y200
    }
});
