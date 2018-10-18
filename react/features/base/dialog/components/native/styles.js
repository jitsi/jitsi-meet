// @flow

import { StyleSheet } from 'react-native';

import { BoxModel, ColorPalette, createStyleSheet } from '../../../styles';

import { PREFERRED_DIALOG_SIZE } from '../../constants';

const BORDER_RADIUS = 5;
const DIALOG_BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';

export const FIELD_UNDERLINE = ColorPalette.transparent;
export const PLACEHOLDER_COLOR = ColorPalette.lightGrey;

/**
 * The React {@code Component} styles of {@code BottomSheet}. These have
 * been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export const bottomSheetStyles = createStyleSheet({
    /**
     * Style for a backdrop which dims the view in the background. This view
     * will also be clickable. The backgroundColor is applied to the overlay
     * view instead, so the modal animation doesn't affect the backdrop.
     */
    backdrop: {
        ...StyleSheet.absoluteFillObject
    },

    /**
     * Style for the container of the sheet.
     */
    container: {
        alignItems: 'flex-end',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    /**
     * Style for an overlay on top of which the sheet will be displayed.
     */
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },

    /**
     * Bottom sheet's base style.
     */
    sheet: {
        backgroundColor: ColorPalette.white,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 8
    }
});

export const brandedDialog = createStyleSheet({

    /**
     * The style of bold {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    boldDialogText: {
        fontWeight: 'bold'
    },

    button: {
        backgroundColor: ColorPalette.blue,
        flex: 1,
        padding: BoxModel.padding * 1.5
    },

    buttonFarLeft: {
        borderBottomLeftRadius: BORDER_RADIUS
    },

    buttonFarRight: {
        borderBottomRightRadius: BORDER_RADIUS
    },

    buttonSeparator: {
        borderRightColor: DIALOG_BORDER_COLOR,
        borderRightWidth: 1
    },

    buttonWrapper: {
        alignItems: 'stretch',
        borderRadius: BORDER_RADIUS,
        flexDirection: 'row'
    },

    closeStyle: {
        color: ColorPalette.white,
        fontSize: 16
    },

    closeWrapper: {
        alignSelf: 'flex-end',
        padding: BoxModel.padding
    },

    dialog: {
        alignItems: 'stretch',
        backgroundColor: 'rgb(0, 3, 6)',
        borderColor: DIALOG_BORDER_COLOR,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'column',
        maxWidth: PREFERRED_DIALOG_SIZE
    },

    mainWrapper: {
        alignSelf: 'stretch',
        padding: BoxModel.padding * 2,

        // The added bottom padding is to compensate the empty space around the
        // close icon.
        paddingBottom: BoxModel.padding * 3
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: 'rgba(127, 127, 127, 0.6)',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 30
    },

    text: {
        color: ColorPalette.white,
        fontSize: 16,
        textAlign: 'center'
    }
});

/**
 * The React {@code Component} styles of {@code Dialog}.
 */
export const dialog = createStyleSheet({
    /**
     * The style of the {@code Text} in a {@code Dialog} button.
     */
    buttonText: {
        color: ColorPalette.blue
    },

    /**
     * The style of the {@code Text} in a {@code Dialog} button which is
     * disabled.
     */
    disabledButtonText: {
        color: ColorPalette.darkGrey
    }
});

export const inputDialog = createStyleSheet({
    bottomField: {
        marginBottom: 0
    },

    field: {
        ...brandedDialog.text,
        borderBottomWidth: 1,
        borderColor: DIALOG_BORDER_COLOR,
        margin: BoxModel.margin,
        textAlign: 'left'
    },

    fieldLabel: {
        ...brandedDialog.text,
        margin: BoxModel.margin,
        textAlign: 'left'
    },

    fieldWrapper: {
        ...brandedDialog.mainWrapper,
        paddingBottom: BoxModel.padding * 2
    }
});
