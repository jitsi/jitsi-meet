import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The base style for toolbars.
 *
 * @type {Object}
 */
const _toolbar = {
    flex: 1,
    position: 'absolute'
};

/**
 * The base style of toolbar buttons (in primaryToolbar and secondaryToolbar).
 *
 * @type {Object}
 */
const _toolbarButton = {
    flex: 0,
    justifyContent: 'center',
    opacity: 0.7
};

/**
 * The base icon style of toolbar buttons (in primaryToolbar and
 * secondaryToolbar).
 *
 * @type {Object}
 */
const _toolbarButtonIcon = {
    alignSelf: 'center'
};

/**
 * The style of toolbar buttons in primaryToolbar.
 */
const primaryToolbarButton = {
    ..._toolbarButton,
    backgroundColor: ColorPalette.white,
    borderRadius: 30,
    borderWidth: 0,
    flexDirection: 'row',
    height: 60,
    margin: BoxModel.margin,
    width: 60
};

/**
 * The icon style of the toolbar buttons in primaryToolbar.
 *
 * @type {Object}
 */
const primaryToolbarButtonIcon = {
    ..._toolbarButtonIcon,
    color: ColorPalette.darkGrey,
    fontSize: 24
};

/**
 * The icon style of the toolbar buttons in secondaryToolbar.
 *
 * @type {Object}
 */
const secondaryToolbarButtonIcon = {
    ..._toolbarButtonIcon,
    color: ColorPalette.white,
    fontSize: 18
};

/**
 * The (conference) Toolbox/Toolbar related styles.
 */
export default createStyleSheet({
    /**
     * The style of the toolbar button in {@link #primaryToolbar} which
     * hangs the current conference up.
     */
    hangup: {
        ...primaryToolbarButton,
        backgroundColor: ColorPalette.red
    },

    /**
     * The style of the toolbar which contains the primary buttons such as
     * hangup, audio and video mute.
     */
    primaryToolbar: {
        ..._toolbar,
        bottom: 3 * BoxModel.margin,
        flexDirection: 'row',
        justifyContent: 'center',
        left: 0,
        right: 0
    },

    /**
     * The style of toolbar buttons in {@link #primaryToolbar}.
     */
    primaryToolbarButton,

    /**
     * The icon style of the toolbar buttons in {@link #primaryToolbar}.
     */
    primaryToolbarButtonIcon,

    /**
     * The style of the toolbar which contains the secondary buttons such as
     * toggle camera facing mode.
     */
    secondaryToolbar: {
        ..._toolbar,
        bottom: 0,
        flexDirection: 'column',
        right: BoxModel.margin,
        top: BoxModel.margin * 2
    },

    /**
     * The style of toolbar buttons in {@link #secondaryToolbar}.
     */
    secondaryToolbarButton: {
        ..._toolbarButton,
        backgroundColor: ColorPalette.darkGrey,
        borderRadius: 20,
        flexDirection: 'column',
        height: 40,
        margin: BoxModel.margin / 2,
        width: 40
    },

    /**
     * The icon style of the toolbar buttons in {@link #secondaryToolbar}.
     */
    secondaryToolbarButtonIcon,

    /**
     * The icon style of the toolbar button in {@link #secondaryToolbar} which
     * toggles the audio-only mode of the current conference.
     */
    toggleAudioOnlyIcon: {
        ...secondaryToolbarButtonIcon,
        transform: [ { rotate: '135deg' } ]
    },

    /**
     * The style of the root/top-level {@link Container} of {@link Toolbox}
     * which contains {@link Toolbar}s.
     */
    toolbarContainer: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    /**
     * The style of toolbar buttons in {@link #primaryToolbar} which display
     * white icons.
     */
    whitePrimaryToolbarButton: {
        ...primaryToolbarButton,
        backgroundColor: ColorPalette.buttonUnderlay
    },

    /**
     * The icon style of toolbar buttons in {@link #primaryToolbar} which
     * display white icons.
     */
    whitePrimaryToolbarButtonIcon: {
        ...primaryToolbarButtonIcon,
        color: ColorPalette.white
    }
});
