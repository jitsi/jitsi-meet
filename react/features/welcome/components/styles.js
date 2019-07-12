// @flow

import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

export const PLACEHOLDER_TEXT_COLOR = 'rgba(255, 255, 255, 0.3)';

export const SIDEBAR_AVATAR_SIZE = 100;

const SIDEBAR_HEADER_HEIGHT = 150;

export const SWITCH_THUMB_COLOR = ColorPalette.blueHighlight;

export const SWITCH_UNDER_COLOR = 'rgba(0, 0, 0, 0.4)';

/**
 * The default color of text on the WelcomePage.
 */
const TEXT_COLOR = ColorPalette.white;

/**
 * The styles of the React {@code Components} of the feature welcome including
 * {@code WelcomePage} and {@code BlankPage}.
 */
export default createStyleSheet({

    /**
     * The audio-video switch itself.
     */
    audioVideoSwitch: {
        marginHorizontal: 5
    },

    /**
     * View that contains the audio-video switch and the labels.
     */
    audioVideoSwitchContainer: {
        alignItems: 'center',
        flexDirection: 'row'
    },

    /**
     * Join button style.
     */
    button: {
        backgroundColor: ColorPalette.blue,
        borderColor: ColorPalette.blue,
        borderRadius: 4,
        borderWidth: 1,
        height: 30,
        justifyContent: 'center',
        paddingHorizontal: 20
    },

    /**
     * Renders the button visually disabled.
     */
    buttonDisabled: {
        backgroundColor: '#cccccc',
        borderColor: '#999999'
    },

    /**
     * Join button text style.
     */
    buttonText: {
        alignSelf: 'center',
        color: ColorPalette.white,
        fontSize: 14
    },

    /**
     * The style of the display name label in the side bar.
     */
    displayName: {
        color: ColorPalette.white,
        fontSize: 16,
        marginTop: BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * The welcome screen header style.
     */
    header: {
        justifyContent: 'space-between'
    },

    /**
     * Container for the button on the hint box.
     */
    hintButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    /**
     * Container for the hint box.
     */
    hintContainer: {
        backgroundColor: ColorPalette.white,
        borderColor: ColorPalette.white,
        borderRadius: 4,
        borderWidth: 1,
        flexDirection: 'column',
        marginVertical: 5,
        overflow: 'hidden',
        paddingHorizontal: BoxModel.padding,
        paddingVertical: 2 * BoxModel.padding
    },

    /**
     * The text of the hint box.
     */
    hintText: {
        textAlign: 'center'
    },

    /**
     * Container for the text on the hint box.
     */
    hintTextContainer: {
        marginBottom: 2 * BoxModel.margin
    },

    /**
     * Container for the items in the side bar.
     */
    itemContainer: {
        flexDirection: 'column',
        paddingTop: 10
    },

    /**
     * A view that contains the field and hint box.
     */
    joinControls: {
        padding: BoxModel.padding
    },

    /**
     * The style of the top-level container/{@code View} of
     * {@code LocalVideoTrackUnderlay}.
     */
    localVideoTrackUnderlay: {
        alignSelf: 'stretch',
        backgroundColor: 'transparent',
        flex: 1
    },

    /**
     * Top-level screen style.
     */
    page: {
        flex: 1,
        flexDirection: 'column'
    },

    /**
     * The styles for reduced UI mode.
     */
    reducedUIContainer: {
        alignItems: 'center',
        backgroundColor: ColorPalette.blue,
        flex: 1,
        justifyContent: 'center'
    },

    reducedUIText: {
        color: TEXT_COLOR,
        fontSize: 12
    },

    /**
     * Container for room name input box and 'join' button.
     */
    roomContainer: {
        alignSelf: 'stretch',
        flexDirection: 'column'
    },

    /**
     * Container of the side bar.
     */
    sideBar: {
        width: 250
    },

    /**
     * The body of the side bar where the items are.
     */
    sideBarBody: {
        backgroundColor: ColorPalette.white,
        flex: 1
    },

    /**
     * The style of the side bar header.
     */
    sideBarHeader: {
        alignItems: 'center',
        flexDirection: 'column',
        height: SIDEBAR_HEADER_HEIGHT,
        justifyContent: 'center',
        padding: BoxModel.padding
    },

    /**
     * Style of the menu items in the side bar.
     */
    sideBarItem: {
        padding: 13
    },

    /**
     * The View inside the side bar buttons (icon + text).
     */
    sideBarItemButtonContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },

    /**
     * The icon in the side bar item touchables.
     */
    sideBarItemIcon: {
        color: ColorPalette.blueHighlight,
        fontSize: 20,
        marginRight: 15
    },

    /**
     * The label of the side bar item touchables.
     */
    sideBarItemText: {
        color: ColorPalette.black,
        fontWeight: 'bold'
    },

    /**
     * The container of the label of the audio-video switch.
     */
    switchLabel: {
        paddingHorizontal: 3
    },

    /**
     * Room input style.
     */
    textInput: {
        backgroundColor: 'transparent',
        borderColor: ColorPalette.white,
        borderRadius: 4,
        borderWidth: 1,
        color: TEXT_COLOR,
        fontSize: 23,
        height: 50,
        padding: 4,
        textAlign: 'center'
    },

    /**
     * Application title style.
     */
    title: {
        color: TEXT_COLOR,
        fontSize: 25,
        marginBottom: 2 * BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * The style of the top-level container of {@code WelcomePage}.
     */
    welcomePage: {
        backgroundColor: ColorPalette.blue,
        overflow: 'hidden'
    }
});
