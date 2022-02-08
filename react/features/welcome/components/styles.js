// @flow

import { StyleSheet } from 'react-native';

import { BoxModel } from '../../base/styles';
import BaseTheme from '../../base/ui/components/BaseTheme.native';

export const PLACEHOLDER_TEXT_COLOR = BaseTheme.palette.text01;

export const DRAWER_AVATAR_SIZE = 104;

const DRAWER_HEADER_HEIGHT = 220;

export const SWITCH_THUMB_COLOR = BaseTheme.palette.action04;

export const SWITCH_UNDER_COLOR = BaseTheme.palette.video01Disabled;

/**
 * The default color of text on the WelcomePage.
 */
const TEXT_COLOR = BaseTheme.palette.text01;

/**
 * The styles of the React {@code Components} of the feature welcome including
 * {@code WelcomePage} and {@code BlankPage}.
 */
export default {

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
        flexDirection: 'row',
        marginRight: BaseTheme.spacing[3]
    },

    blankPageText: {
        color: TEXT_COLOR,
        fontSize: 18
    },

    /**
     * View that is rendered when there is no welcome page.
     */
    blankPageWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    /**
     * Join button style.
     */
    button: {
        backgroundColor: BaseTheme.palette.screen01Header,
        borderColor: BaseTheme.palette.screen01Header,
        borderRadius: 4,
        borderWidth: 1,
        height: 30,
        justifyContent: 'center',
        paddingHorizontal: 20
    },

    /**
     * Join button text style.
     */
    buttonText: {
        alignSelf: 'center',
        color: BaseTheme.palette.text01,
        fontSize: 14
    },

    /**
     * The style of the display name label in the side bar.
     */
    displayName: {
        color: BaseTheme.palette.text01,
        fontSize: 16,
        marginTop: BoxModel.margin,
        textAlign: 'center'
    },

    enterRoomText: {
        color: TEXT_COLOR,
        fontSize: 18,
        marginBottom: BoxModel.margin
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
        flexDirection: 'column',
        overflow: 'hidden'
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

    messageContainer: {
        backgroundColor: BaseTheme.palette.ui12,
        borderColor: BaseTheme.palette.field02,
        borderRadius: 4,
        borderWidth: 1,
        marginVertical: 5,
        paddingHorizontal: BoxModel.padding,
        paddingVertical: 2 * BoxModel.padding
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
        backgroundColor: BaseTheme.palette.screen01Header,
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
        flexDirection: 'column',
        marginHorizontal: BaseTheme.spacing[2]
    },

    /**
     * The style of the side bar header.
     */
    drawerHeader: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.screen01Header,
        flexDirection: 'column',
        height: DRAWER_HEADER_HEIGHT,
        justifyContent: 'center'
    },

    drawerNavigationIcon: {
        height: BaseTheme.spacing[6],
        marginLeft: BaseTheme.spacing[3],
        width: BaseTheme.spacing[6]
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
        borderColor: BaseTheme.palette.field02,
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

    insecureRoomNameWarningContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 5
    },

    insecureRoomNameWarningIcon: {
        color: BaseTheme.palette.warning03,
        fontSize: 24,
        marginRight: 10
    },

    insecureRoomNameWarningText: {
        color: BaseTheme.palette.warning03,
        flex: 1
    },

    /**
     * The style of the top-level container of {@code WelcomePage}.
     */
    welcomePage: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        overflow: 'hidden'
    },

    recentList: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        overflow: 'hidden'
    },

    recentListDisabled: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        opacity: 0.8,
        overflow: 'hidden'
    },

    /**
     * Style for screen container.
     */
    screenContainer: {
        flex: 1
    }
};
