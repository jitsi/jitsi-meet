import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { schemeColor } from '../../../base/color-scheme/functions';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const BUTTON_SIZE = 52;

// Toolbox, toolbar:

/**
 * The style of toolbar buttons — WhatsApp-style round dark circles.
 */
const toolbarButton = {
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    marginHorizontal: 10,
    marginVertical: 6,
    width: BUTTON_SIZE,
    backgroundColor: '#2A2A2A'
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
    color: '#FFFFFF'
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

const gifButton = {
    ...reactionButton,
    backgroundColor: '#000'
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
    backgroundColor: BaseTheme.palette.ui01
};

/**
 * The Toolbox and toolbar related styles — WhatsApp-style.
 */
const styles = {

    sheetGestureRecognizer: {
        alignItems: 'stretch',
        flexDirection: 'column'
    },

    /**
     * The style of the toolbar — transparent to let the dark bar show through.
     */
    toolbox: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    /**
     * The style of the root/top-level container of {@link Toolbox}.
     * WhatsApp-style floating dark rounded bar.
     */
    toolboxContainer: {
        backgroundColor: '#1A1A1A',
        borderRadius: 40,
        flexDirection: 'column',
        maxWidth: 400,
        marginHorizontal: 16,
        marginBottom: 30,
        paddingHorizontal: 8,
        paddingVertical: 4,
        width: 'auto',
        alignSelf: 'center'
    },

    toolboxButtonIconContainer: {
        alignItems: 'center',
        borderRadius: BUTTON_SIZE / 2,
        height: BaseTheme.spacing[7],
        justifyContent: 'center',
        width: BaseTheme.spacing[7]
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
            backgroundColor: '#2A2A2A'
        },
        underlayColor: 'transparent'
    },

    backgroundToggle: {
        backgroundColor: '#444444'
    },

    hangupMenuContainer: {
        marginHorizontal: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[2]
    },

    hangupButton: {
        flex: 1,
        marginHorizontal: BaseTheme.spacing[2],
        marginVertical: BaseTheme.spacing[2]
    },

    hangupButtonStyles: {
        iconStyle: whiteToolbarButtonIcon,
        style: {
            ...toolbarButton,
            backgroundColor: '#FF3B30'
        },
        underlayColor: '#CC2F26'
    },

    reactionDialog: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent'
    },

    overflowReactionMenu: {
        ...reactionMenu,
        padding: BaseTheme.spacing[3]
    },

    reactionMenu: {
        ...reactionMenu,
        paddingHorizontal: BaseTheme.spacing[3],
        borderRadius: 3,
        width: 360
    },

    reactionRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    reactionButton: {
        gifButton,
        style: reactionButton,
        underlayColor: BaseTheme.palette.ui04,
        emoji: reactionEmoji
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
            ...toolbarButton,
            backgroundColor: '#444444'
        },
        underlayColor: 'transparent'
    }
});
