// @flow

import { StyleSheet } from 'react-native';

import { BoxModel, ColorPalette, createStyleSheet } from '../../../styles';

const AVATAR_OPACITY = 0.4;
const HEADER_COLOR = ColorPalette.blue;

const HEADER_HEIGHT = 48;
const OVERLAY_FONT_COLOR = 'rgba(255, 255, 255, 0.6)';
const SECONDARY_ACTION_BUTTON_SIZE = 30;

export const AVATAR_SIZE = 65;
export const HEADER_PADDING = BoxModel.padding / 2;
export const STATUSBAR_COLOR = ColorPalette.blueHighlight;
export const SIDEBAR_WIDTH = 250;
export const UNDERLAY_COLOR = 'rgba(255, 255, 255, 0.2)';

const HEADER_STYLES = {

    disabledButtonText: {
        opacity: 0.6
    },

    /**
     * Platform specific header button (e.g. back, menu, etc).
     */
    headerButtonIcon: {
        alignSelf: 'center',
        color: ColorPalette.white,
        fontSize: 22,
        marginRight: 12,
        padding: 8
    },

    headerButtonText: {
        color: ColorPalette.white,
        fontSize: 20
    },

    /**
     * Style of the header overlay to cover the unsafe areas.
     */
    headerOverlay: {
        backgroundColor: HEADER_COLOR
    },

    /**
     * Generic style for a label placed in the header.
     */
    headerText: {
        color: ColorPalette.white,
        fontSize: 18
    },

    headerTextWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0
    },

    /**
     * The top-level element of a page.
     */
    page: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'stretch',
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden'
    },

    /**
     * Base style of Header.
     */
    screenHeader: {
        alignItems: 'center',
        backgroundColor: HEADER_COLOR,
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        justifyContent: 'space-between',
        paddingHorizontal: BoxModel.padding,
        paddingVertical: HEADER_PADDING
    }
};

/**
 * Style classes of the PagedList-based components.
 */
const PAGED_LIST_STYLES = {

    /**
     * Outermost container of a page in {@code PagedList}.
     */
    pageContainer: {
        flex: 1
    },

    /**
     * Style of the page indicator (Android).
     */
    pageIndicator: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: BoxModel.padding / 2
    },

    /**
     * Additional style for the active indicator icon (Android).
     */
    pageIndicatorActive: {
        color: ColorPalette.white
    },

    /**
     * Container for the page indicators (Android).
     */
    pageIndicatorContainer: {
        alignItems: 'center',
        backgroundColor: ColorPalette.blue,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },

    pageIndicatorContent: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center'
    },

    /**
     * Icon of the page indicator (Android).
     */
    pageIndicatorIcon: {
        color: ColorPalette.blueHighlight,
        fontSize: 24
    },

    /**
     * Label of the page indicator (Android).
     */
    pageIndicatorText: {
        color: ColorPalette.blueHighlight
    },

    /**
     * Top level style of the paged list.
     */
    pagedList: {
        flex: 1
    },

    /**
     * The paged list container View.
     */
    pagedListContainer: {
        flex: 1,
        flexDirection: 'column'
    },

    /**
     * Disabled style for the container.
     */
    pagedListContainerDisabled: {
        opacity: 0.2
    }
};

const SECTION_LIST_STYLES = {
    /**
     * The style of the actual avatar.
     */
    avatar: {
        alignItems: 'center',
        backgroundColor: `rgba(23, 160, 219, ${AVATAR_OPACITY})`,
        justifyContent: 'center'
    },

    /**
     * List of styles of the avatar of a remote meeting (not the default
     * server). The number of colors are limited because they should match
     * nicely.
     */
    avatarColor1: {
        backgroundColor: `rgba(232, 105, 156, ${AVATAR_OPACITY})`
    },

    avatarColor2: {
        backgroundColor: `rgba(255, 198, 115, ${AVATAR_OPACITY})`
    },

    avatarColor3: {
        backgroundColor: `rgba(128, 128, 255, ${AVATAR_OPACITY})`
    },

    avatarColor4: {
        backgroundColor: `rgba(105, 232, 194, ${AVATAR_OPACITY})`
    },

    avatarColor5: {
        backgroundColor: `rgba(234, 255, 128, ${AVATAR_OPACITY})`
    },

    /**
     * The style of the avatar container that makes the avatar rounded.
     */
    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 5
    },

    /**
     * Simple {@code Text} content of the avatar (the actual initials).
     */
    avatarContent: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        color: OVERLAY_FONT_COLOR,
        fontSize: Math.floor(AVATAR_SIZE / 2),
        fontWeight: '100',
        textAlign: 'center'
    },

    /**
     * The top level container style of the list.
     */
    container: {
        flex: 1
    },

    list: {
        flex: 1,
        flexDirection: 'column'
    },

    listItem: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        padding: 5
    },

    listItemDetails: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
        paddingHorizontal: 5
    },

    listItemText: {
        color: OVERLAY_FONT_COLOR,
        fontSize: 14
    },

    listItemTitle: {
        fontWeight: 'bold',
        fontSize: 16
    },

    listSection: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 10
    },

    listSectionText: {
        color: OVERLAY_FONT_COLOR,
        fontSize: 14,
        fontWeight: 'normal'
    },

    pullToRefresh: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 20
    },

    pullToRefreshIcon: {
        backgroundColor: 'transparent',
        color: OVERLAY_FONT_COLOR,
        fontSize: 20
    },

    pullToRefreshText: {
        backgroundColor: 'transparent',
        color: OVERLAY_FONT_COLOR
    },

    secondaryActionContainer: {
        alignItems: 'center',
        backgroundColor: ColorPalette.blue,
        borderRadius: 3,
        height: SECONDARY_ACTION_BUTTON_SIZE,
        justifyContent: 'center',
        margin: BoxModel.margin * 0.5,
        marginRight: BoxModel.margin,
        width: SECONDARY_ACTION_BUTTON_SIZE
    },

    secondaryActionLabel: {
        color: ColorPalette.white
    },

    touchableView: {
        flexDirection: 'row'
    }
};

const SIDEBAR_STYLES = {
    /**
     * The topmost container of the side bar.
     */
    sideMenuContainer: {
        ...StyleSheet.absoluteFillObject
    },

    /**
     * The container of the actual content of the side menu.
     */
    sideMenuContent: {
        bottom: 0,
        left: -SIDEBAR_WIDTH,
        position: 'absolute',
        top: 0,
        width: SIDEBAR_WIDTH
    },

    /**
     * The opaque area that covers the rest of the screen, when the side bar is
     * open.
     */
    sideMenuShadow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
};

export const TINTED_VIEW_DEFAULT = {
    backgroundColor: ColorPalette.appBackground,
    opacity: 0.8
};

/**
 * The styles of the generic React {@code Component}s implemented by the feature
 * base/react.
 */
export default createStyleSheet({
    ...HEADER_STYLES,
    ...PAGED_LIST_STYLES,
    ...SECTION_LIST_STYLES,
    ...SIDEBAR_STYLES
});
