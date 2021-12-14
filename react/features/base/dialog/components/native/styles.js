// @flow

import { StyleSheet } from 'react-native';

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';
import { ColorSchemeRegistry, schemeColor } from '../../../color-scheme';
import { PREFERRED_DIALOG_SIZE } from '../../constants';

const BORDER_RADIUS = BaseTheme.spacing[1];

export const FIELD_UNDERLINE = BaseTheme.palette.ui14;

/**
 * NOTE: These Material guidelines based values are currently only used in
 * dialogs (and related) but later on it would be nice to export it into a base
 * Material feature.
 */
export const MD_FONT_SIZE = BaseTheme.spacing[3];
export const MD_ITEM_HEIGHT = BaseTheme.spacing[7];
export const MD_ITEM_MARGIN_PADDING = BaseTheme.spacing[3];

export const PLACEHOLDER_COLOR = BaseTheme.palette.field03;

/**
 * The React {@code Component} styles of {@code BottomSheet}. These have
 * been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
export const bottomSheetStyles = {
    sheetAreaCover: {
        backgroundColor: BaseTheme.palette.ui14,
        flex: 1
    },

    scrollView: {
        paddingHorizontal: BaseTheme.spacing[0]
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

export const brandedDialog = {

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
        padding: BaseTheme.spacing[2]
    },

    dialogTitle: {
        fontWeight: 'bold',
        paddingLeft: BaseTheme.spacing[2]
    },

    headerWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    mainWrapper: {
        alignSelf: 'stretch',
        padding: BaseTheme.spacing[2]
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: 'rgba(127, 127, 127, 0.6)',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: BaseTheme.spacing[5]
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
    color: BaseTheme.palette.ui12,
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
    color: BaseTheme.palette.ui12,
    fontSize: 24
};

export const inputDialog = {
    bottomField: {
        marginBottom: BaseTheme.spacing[0]
    },

    fieldWrapper: {
        ...brandedDialog.mainWrapper,
        paddingBottom: BaseTheme.spacing[3]
    },

    formMessage: {
        alignSelf: 'flex-start',
        fontStyle: 'italic',
        margin: BaseTheme.spacing[2]
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
            marginLeft: BaseTheme.spacing[3]
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
        underlayColor: BaseTheme.palette.underlay02
    },

    /**
     * Bottom sheet's base style.
     */
    sheet: {
        backgroundColor: BaseTheme.palette.ui02,
        borderTopLeftRadius: BaseTheme.spacing[3],
        borderTopRightRadius: BaseTheme.spacing[3]
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
        padding: BaseTheme.spacing[3]
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
        margin: BaseTheme.spacing[2],
        textAlign: 'left'
    },

    /**
     * Style for the field label on an input dialog.
     */
    fieldLabel: {
        ...brandedDialogText,
        margin: BaseTheme.spacing[2],
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
        paddingBottom: BaseTheme.spacing[2]
    },

    text: {
        color: schemeColor('text'),
        fontSize: 14,
        marginTop: BaseTheme.spacing[2]
    },

    title: {
        color: schemeColor('text'),
        fontSize: 18,
        fontWeight: 'bold'
    }
});
