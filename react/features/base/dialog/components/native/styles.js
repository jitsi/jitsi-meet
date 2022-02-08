// @flow

import { StyleSheet } from 'react-native';

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';
import { ColorSchemeRegistry, schemeColor } from '../../../color-scheme';
import { BoxModel, ColorPalette } from '../../../styles';
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

    scrollView: {
        paddingHorizontal: 0
    },

    /**
     * Style for the container of the sheet.
     */
    sheetContainer: {
        alignItems: 'stretch',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        maxWidth: 500,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%'
    },

    sheetItemContainer: {
        flex: -1
    }
};

export default {
    dialogButton: {
        ...BaseTheme.typography.labelButton
    },

    destructiveDialogButton: {
        ...BaseTheme.typography.labelButton,
        color: BaseTheme.palette.actionDanger
    }
};

export const brandedDialog = {

    /**
     * The style of bold {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    boldDialogText: {
        fontWeight: 'bold'
    },

    buttonFarRight: {
        borderBottomRightRadius: BORDER_RADIUS
    },

    buttonWrapper: {
        alignItems: 'stretch',
        borderRadius: BORDER_RADIUS,
        flexDirection: 'row'
    },

    mainWrapper: {
        alignSelf: 'stretch',
        padding: BoxModel.padding * 2,

        // The added bottom padding is to compensate the empty space around the
        // close icon.
        paddingBottom: BoxModel.padding * 3
    },

    overlayTouchable: {
        ...StyleSheet.absoluteFillObject
    }
};

/**
 * Reusable (colored) style for text in any branded dialogs.
 */
const brandedDialogText = {
    color: schemeColor('text'),
    fontSize: MD_FONT_SIZE,
    textAlign: 'center'
};

const brandedDialogLabelStyle = {
    color: ColorPalette.white,
    flexShrink: 1,
    fontSize: MD_FONT_SIZE,
    opacity: 0.90
};

const brandedDialogItemContainerStyle = {
    alignItems: 'center',
    flexDirection: 'row',
    height: MD_ITEM_HEIGHT
};

const brandedDialogIconStyle = {
    color: ColorPalette.white,
    fontSize: 24
};

export const inputDialog = {
    formMessage: {
        alignSelf: 'flex-start',
        fontStyle: 'italic',
        fontWeight: 'bold',
        marginTop: BaseTheme.spacing[3]
    }
};

/**
 * Default styles for the items of a {@code BottomSheet}-based menu.
 *
 * These have been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
ColorSchemeRegistry.register('BottomSheet', {
    buttons: {
        /**
         * Style for the {@code Icon} element in a generic item of the menu.
         */
        iconStyle: {
            ...brandedDialogIconStyle
        },

        /**
         * Style for the label in a generic item rendered in the menu.
         */
        labelStyle: {
            ...brandedDialogLabelStyle,
            marginLeft: 16
        },

        /**
         * Container style for a generic item rendered in the menu.
         */
        style: {
            ...brandedDialogItemContainerStyle,
            paddingHorizontal: MD_ITEM_MARGIN_PADDING
        },

        /**
         * Additional style that is not directly used as a style object.
         */
        underlayColor: ColorPalette.toggled
    },

    /**
     * Bottom sheet's base style.
     */
    sheet: {
        backgroundColor: BaseTheme.palette.ui02,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
    },

    /**
     * Bottom sheet's base style with header.
     */
    sheetHeader: {
        backgroundColor: BaseTheme.palette.ui02
    },

    /**
     * Bottom sheet's background color with footer.
     */
    sheetFooter: {
        backgroundColor: BaseTheme.palette.bottomSheet
    }
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

ColorSchemeRegistry.register('SecurityDialog', {
    /**
     * Field on an input dialog.
     */
    field: {
        borderBottomWidth: 1,
        borderColor: schemeColor('border'),
        color: schemeColor('text'),
        fontSize: 14,
        paddingBottom: 8
    },

    text: {
        color: schemeColor('text'),
        fontSize: 14,
        marginTop: 8
    },

    title: {
        color: schemeColor('text'),
        fontSize: 18,
        fontWeight: 'bold'
    }
});
