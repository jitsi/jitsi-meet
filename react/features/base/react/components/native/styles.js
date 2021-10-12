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
        padding: BoxModel.padding / 2,
        opacity: 0.6,
        backgroundColor: '#333366',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000000',
        shadowOffset: {
          width: 0,
          height: 3
        },
        shadowRadius: 5,
        shadowOpacity: 1.0
      
      // backgroundColor:ColorPalette.darkGrey  
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
    //#asd button back color
    pageIndicatorContainer: {
        alignItems: 'center',
        backgroundColor: 'transparent',//ColorPalette.blue,
        flexDirection: 'row',
        justifyContent: 'space-around',
        // opacity: 0.6,
        // backgroundColor: '#333366',
        // borderRadius: 10,
        // padding: 10,
        // shadowColor: '#000000',
        // shadowOffset: {
        //   width: 0,
        //   height: 3
        // },
        // shadowRadius: 5,
        // shadowOpacity: 1.0
      
    },

    pageIndicatorContent: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        gradient:true,
        borderColor: ColorPalette.red,
         // backgroundColor:ColorPalette.darkGrey  
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
        color: ColorPalette.blueHighlight,
       // backgroundColor: ColorPalette.red

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
        padding: 5,
       // color:'red',
    },

    /**
     * Simple {@code Text} content of the avatar (the actual initials).
     */
    //#asd avatar size
    avatarContent: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        color: OVERLAY_FONT_COLOR,
        fontSize: Math.floor(AVATAR_SIZE / 2),
        fontWeight: '100',
        textAlign: 'center',
        
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
//#asd recent & calendar color
    listItemText: {
        color:'white',// OVERLAY_FONT_COLOR,
        // textShadowColor: 'black',
        // textShadowOffset: { width: 3, height: 3 },
        // textShadowRadius: 40,
        shadowColor: "black",
shadowOffset: {
	width: -1,
	height: -1,
},
shadowOpacity: 4.7,
shadowRadius:0.1,

elevation: 6,
        fontSize: 16
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
//#asd section color
    listSectionText: {
        color:'white',// OVERLAY_FONT_COLOR,
        fontSize: 14,
        fontWeight: 'normal',
        shadowColor: "black",
        shadowOffset: {
            width: -1,
            height: -1,
        },
        shadowOpacity: 4.7,
        shadowRadius:0.1,
        
        elevation: 6,
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
