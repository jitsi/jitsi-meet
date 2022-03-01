// @flow

import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const BUTTON_SIZE = 48;

// Toolbox, toolbar:

/**
 * The style of toolbar buttons.
 */
const toolbarButton = {
    borderRadius: 3,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 6,
    width: BUTTON_SIZE
};

/**
 * The icon style of the toolbar buttons.
 */
const toolbarButtonIcon = {
    alignSelf: 'center',
    color: BaseTheme.palette.icon04,
    fontSize: 24
};


/**
 * The icon style of toolbar buttons which display white icons.
 */
const whiteToolbarButtonIcon = {
    ...toolbarButtonIcon,
    color: BaseTheme.palette.icon01
};

/**
 * The style of reaction buttons.
 */
const reactionButton = {
    ...toolbarButton,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: 0,
    marginHorizontal: 0
};

/**
 * The style of the emoji on the reaction buttons.
 */
const reactionEmoji = {
    fontSize: 20,
    color: BaseTheme.palette.icon01
};

const reactionMenu = {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BaseTheme.palette.bottomSheet,
    padding: BaseTheme.spacing[3]
};

/**
 * The Toolbox and toolbar related styles.
 */
const styles = {

    sheetGestureRecognizer: {
        alignItems: 'stretch',
        flexDirection: 'column'
    },

    /**
     * The style of the toolbar.
     */
    toolbox: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    /**
     * The style of the root/top-level container of {@link Toolbox}.
     */
    toolboxContainer: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flexDirection: 'column',
        maxWidth: 580,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%'
    }
};

export default styles;

/**
 * Color schemed styles for the @{Toolbox} component.
 */
ColorSchemeRegistry.register('Toolbox', {
    /**
     * Styles for buttons in the toolbar.
     */
    buttonStyles: {
        iconStyle: toolbarButtonIcon,
        style: toolbarButton
    },

    buttonStylesBorderless: {
        iconStyle: whiteToolbarButtonIcon,
        style: {
            ...toolbarButton,
            backgroundColor: 'transparent'
        }
    },

    backgroundToggle: {
        backgroundColor: BaseTheme.palette.ui13
    },

    hangupButtonStyles: {
        iconStyle: whiteToolbarButtonIcon,
        style: {
            ...toolbarButton,
            backgroundColor: schemeColor('hangup')
        },
        underlayColor: BaseTheme.palette.underlay01
    },

    reactionDialog: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent'
    },

    overflowReactionMenu: reactionMenu,

    reactionMenu: {
        ...reactionMenu,
        borderRadius: 3,
        width: 360
    },

    reactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16
    },

    reactionButton: {
        style: reactionButton,
        underlayColor: BaseTheme.palette.ui13,
        emoji: reactionEmoji
    },

    raiseHandButton: {
        style: {
            ...reactionButton,
            backgroundColor: BaseTheme.palette.ui13,
            width: '100%',
            borderRadius: 6
        },
        underlayColor: BaseTheme.palette.ui13,
        emoji: reactionEmoji,
        text: {
            color: BaseTheme.palette.text01,
            fontWeight: '600',
            marginLeft: 8,
            lineHeight: 24
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        }
    },

    emojiAnimation: {
        color: BaseTheme.palette.icon01,
        position: 'absolute',
        zIndex: 1001,
        elevation: 2,
        fontSize: 20,
        left: '50%',
        top: '100%'
    },

    /**
     * Styles for toggled buttons in the toolbar.
     */
    toggledButtonStyles: {
        iconStyle: whiteToolbarButtonIcon,
        style: {
            ...toolbarButton
        }
    }
});
