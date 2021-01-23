// @flow

import { BoxModel, ColorPalette } from '../../../styles';

const OVERLAY_FONT_COLOR = 'rgba(255, 255, 255, 0.6)';
const SECONDARY_ACTION_BUTTON_SIZE = 30;

export const AVATAR_SIZE = 65;
export const UNDERLAY_COLOR = 'rgba(255, 255, 255, 0.2)';

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

export const TINTED_VIEW_DEFAULT = {
    backgroundColor: ColorPalette.appBackground,
    opacity: 0.8
};

export const BASE_INDICATOR = {
    alignItems: 'center',
    justifyContent: 'center'
};

/**
 * The styles of the generic React {@code Component}s implemented by the feature
 * base/react.
 */
export default {
    ...PAGED_LIST_STYLES,
    ...SECTION_LIST_STYLES
};
