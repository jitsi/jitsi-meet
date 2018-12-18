// @flow
import { BoxModel, ColorPalette, createStyleSheet } from '../../../base/styles';

import { HANGUP_BUTTON_SIZE } from '../../constants';

// Toolbox, toolbar:

/**
 * The style of toolbar buttons.
 */
const toolbarButton = {
    backgroundColor: ColorPalette.white,
    borderRadius: 20,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',

    // XXX We probably tested BoxModel.margin and discovered it to be too small
    // for our taste.
    marginHorizontal: 7,
    opacity: 0.7,
    width: 40
};

/**
 * The icon style of the toolbar buttons.
 */
const toolbarButtonIcon = {
    alignSelf: 'center',
    color: ColorPalette.darkGrey,
    fontSize: 22
};

/**
 * The Toolbox and toolbar related styles.
 */
const styles = createStyleSheet({
    /**
     * The style of the toolbar button which hangs the current conference up.
     */
    hangupButton: {
        ...toolbarButton,
        backgroundColor: ColorPalette.red,
        borderRadius: 30,
        height: HANGUP_BUTTON_SIZE,
        width: HANGUP_BUTTON_SIZE
    },

    /**
     * The icon style of toolbar buttons which hangs the current conference up.
     */
    hangupButtonIcon: {
        ...toolbarButtonIcon,
        color: ColorPalette.white,
        fontSize: 24
    },

    /**
     * The style of the toolbar.
     */
    toolbar: {
        alignItems: 'center',
        flexDirection: 'row',
        flexGrow: 0,
        justifyContent: 'center',
        marginBottom: BoxModel.margin / 2,
        paddingHorizontal: BoxModel.margin
    },

    /**
     * The style of toolbar buttons.
     */
    toolbarButton,

    /**
     * The icon style of the toolbar buttons.
     */
    toolbarButtonIcon,

    /**
     * The style of the root/top-level {@link Container} of {@link Toolbox}.
     */
    toolbox: {
        flexDirection: 'column',
        flexGrow: 0
    },

    /**
     * The style of toolbar buttons which display white icons.
     */
    whiteToolbarButton: {
        ...toolbarButton,
        backgroundColor: ColorPalette.buttonUnderlay
    },

    /**
     * The icon style of toolbar buttons which display white icons.
     */
    whiteToolbarButtonIcon: {
        ...toolbarButtonIcon,
        color: ColorPalette.white
    }
});

export default styles;

/**
 * Styles for the hangup button.
 */
export const hangupButtonStyles = {
    iconStyle: styles.whiteToolbarButtonIcon,
    style: styles.hangupButton,
    underlayColor: ColorPalette.buttonUnderlay
};

/**
 * Styles for buttons in the toolbar.
 */
export const toolbarButtonStyles = {
    iconStyle: styles.toolbarButtonIcon,
    style: styles.toolbarButton
};

/**
 * Styles for toggled buttons in the toolbar.
 */
export const toolbarToggledButtonStyles = {
    iconStyle: styles.whiteToolbarButtonIcon,
    style: styles.whiteToolbarButton
};

// Overflow menu:

/**
 * Styles for the {@code OverflowMenu} items.
 *
 * These have been implemented as per the Material Design guidelines:
 * {@link https://material.io/guidelines/components/bottom-sheets.html}.
 */
const overflowMenuStyles = createStyleSheet({
    /**
     * Container style for a {@code ToolboxItem} rendered in the
     * {@code OverflowMenu}.
     */
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        height: 48
    },

    /**
     * Style for the {@code Icon} element in a {@code ToolboxItem} rendered in
     * the {@code OverflowMenu}.
     */
    icon: {
        color: ColorPalette.white,
        fontSize: 24
    },

    /**
     * Style for the label in a {@code ToolboxItem} rendered in the
     * {@code OverflowMenu}.
     */
    label: {
        color: ColorPalette.white,
        flexShrink: 1,
        fontSize: 16,
        marginLeft: 32,
        opacity: 0.90
    }
});

export const overflowMenuItemStyles = {
    iconStyle: overflowMenuStyles.icon,
    labelStyle: overflowMenuStyles.label,
    style: overflowMenuStyles.container,
    underlayColor: ColorPalette.overflowMenuItemUnderlay
};
