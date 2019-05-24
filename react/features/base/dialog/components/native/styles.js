// @flow

import { StyleSheet } from 'react-native';

import { ColorSchemeRegistry, schemeColor } from '../../../color-scheme';
import { BoxModel, ColorPalette, createStyleSheet } from '../../../styles';

import { PREFERRED_DIALOG_SIZE } from '../../constants';

const BORDER_RADIUS = 5;

export const FIELD_UNDERLINE = ColorPalette.transparent;

/**
 * NOTE: These Material guidelines based values are currently only used in
 * dialogs (and related) but later on it would be nice to export it into a base
 * Material feature.
 */
export const MD_FONT_SIZE = 16;
export const MD_ITEM_HEIGHT = 48;
export const MD_ITEM_MARGIN_PADDING = 16;

export const PLACEHOLDER_COLOR = ColorPalette.lightGrey;

/**
 * The React {@code Component} styles of {@code BottomSheet}. These have
 * been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export const bottomSheetStyles = {
    sheetAreaCover: {
        backgroundColor: ColorPalette.transparent,
        flex: 1
    },

    /**
     * Style for the container of the sheet.
     */
    sheetContainer: {
        alignContent: 'stretch',
        flex: 1,
        flexDirection: 'column'
    },

    sheetItemContainer: {
        paddingHorizontal: MD_ITEM_MARGIN_PADDING
    }
};

export const brandedDialog = createStyleSheet({

    /**
     * The style of bold {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    boldDialogText: {
        fontWeight: 'bold'
    },

    buttonFarLeft: {
        borderBottomLeftRadius: BORDER_RADIUS
    },

    buttonFarRight: {
        borderBottomRightRadius: BORDER_RADIUS
    },

    buttonWrapper: {
        alignItems: 'stretch',
        borderRadius: BORDER_RADIUS,
        flexDirection: 'row'
    },

    closeWrapper: {
        alignSelf: 'flex-end',
        padding: BoxModel.padding
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
    }
});

/**
 * Reusable (colored) style for text in any branded dialogs.
 */
const brandedDialogText = {
    color: schemeColor('text'),
    fontSize: MD_FONT_SIZE,
    textAlign: 'center'
};

export const inputDialog = createStyleSheet({
    bottomField: {
        marginBottom: 0
    },

    fieldWrapper: {
        ...brandedDialog.mainWrapper,
        paddingBottom: BoxModel.padding * 2
    }
});

/**
 * Default styles for the items of a {@code BottomSheet}-based menu.
 *
 * These have been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
ColorSchemeRegistry.register('BottomSheet', {
    /**
     * Style for the {@code Icon} element in a generic item of the menu.
     */
    iconStyle: {
        color: schemeColor('icon'),
        fontSize: 24
    },

    /**
     * Style for the label in a generic item rendered in the menu.
     */
    labelStyle: {
        color: schemeColor('label'),
        flexShrink: 1,
        fontSize: MD_FONT_SIZE,
        marginLeft: 32,
        opacity: 0.90
    },

    /**
     * Bottom sheet's base style.
     */
    sheet: {
        backgroundColor: schemeColor('background')
    },

    /**
     * Container style for a generic item rendered in the menu.
     */
    style: {
        alignItems: 'center',
        flexDirection: 'row',
        height: MD_ITEM_HEIGHT
    },

    /**
     * Additional style that is not directly used as a style object.
     */
    underlayColor: ColorPalette.overflowMenuItemUnderlay
});

/**
 * Color schemed styles for all the component based on the abstract dialog.
 */
ColorSchemeRegistry.register('Dialog', {
    button: {
        backgroundColor: schemeColor('buttonBackground'),
        flex: 1,
        padding: BoxModel.padding * 1.5
    },

    /**
     * Separator line for the buttons in a dialog.
     */
    buttonSeparator: {
        borderRightColor: schemeColor('border'),
        borderRightWidth: 1
    },

    buttonLabel: {
        color: schemeColor('buttonLabel'),
        fontSize: MD_FONT_SIZE,
        textAlign: 'center'
    },

    /**
     * Style of the close icon on a dialog.
     */
    closeStyle: {
        color: schemeColor('icon'),
        fontSize: MD_FONT_SIZE
    },

    /**
     * Base style of the dialogs.
     */
    dialog: {
        alignItems: 'stretch',
        backgroundColor: schemeColor('background'),
        borderColor: schemeColor('border'),
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'column',
        maxWidth: PREFERRED_DIALOG_SIZE
    },

    /**
     * Field on an input dialog.
     */
    field: {
        ...brandedDialogText,
        borderBottomWidth: 1,
        borderColor: schemeColor('border'),
        margin: BoxModel.margin,
        textAlign: 'left'
    },

    /**
     * Style for the field label on an input dialog.
     */
    fieldLabel: {
        ...brandedDialogText,
        margin: BoxModel.margin,
        textAlign: 'left'
    },

    text: {
        ...brandedDialogText
    },

    topBorderContainer: {
        borderTopColor: schemeColor('border'),
        borderTopWidth: 1
    }
});
