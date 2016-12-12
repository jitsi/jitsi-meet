import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The base style for (toolbar) buttons.
 *
 * @type {Object}
 */
const button = {
    borderRadius: 35,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'center',
    margin: BoxModel.margin,
    width: 60
};

/**
 * The base style for icons.
 *
 * @type {Object}
 */
const icon = {
    alignSelf: 'center',
    color: ColorPalette.darkGrey,
    fontSize: 24
};

/**
 * The base style for toolbars.
 *
 * @type {Object}
 */
const toolbar = {
    flex: 1,
    position: 'absolute'
};

/**
 * The (conference) toolbar related styles.
 */
export const styles = createStyleSheet({
    /**
     * The toolbar button icon style.
     */
    icon,

    /**
     * The style of the toolbar which contains the primary buttons such as
     * hangup, audio and video mute.
     */
    primaryToolbar: {
        ...toolbar,
        bottom: 3 * BoxModel.margin,
        flexDirection: 'row',
        justifyContent: 'center',
        left: 0,
        right: 0
    },

    /**
     * The style of button in primaryToolbar.
     */
    primaryToolbarButton: {
        ...button,
        backgroundColor: ColorPalette.white,
        opacity: 0.8
    },

    /**
     * The style of the toolbar which contains the secondary buttons such as
     * toggle camera facing mode.
     */
    secondaryToolbar: {
        ...toolbar,
        bottom: 0,
        flexDirection: 'column',
        right: 0,
        top: 0
    },

    /**
     * The style of button in secondaryToolbar.
     */
    secondaryToolbarButton: {
        ...button,
        backgroundColor: 'transparent'
    },

    /**
     * The style of the root/top-level Container of Toolbar.
     */
    toolbarContainer: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * The toolbar white button icon style.
     */
    whiteIcon: {
        ...icon,
        color: ColorPalette.white
    }
});
