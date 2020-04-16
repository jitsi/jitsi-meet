// @flow

import { BoxModel } from '../../../../base/styles';

export const AVATAR_SIZE = 40;
export const DARK_GREY = 'rgb(28, 32, 37)';
export const LIGHT_GREY = 'rgb(209, 219, 232)';
export const ICON_SIZE = 15;

const FIELD_COLOR = 'rgb(240, 243, 247)';

export default {
    avatar: {
        backgroundColor: LIGHT_GREY
    },

    avatarText: {
        color: DARK_GREY,
        fontSize: 12
    },

    bottomBar: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },

    clearButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5
    },

    clearIcon: {
        color: DARK_GREY,
        fontSize: 18,
        textAlign: 'center'
    },

    clearIconContainer: {
        alignItems: 'center',
        backgroundColor: FIELD_COLOR,
        borderRadius: 12,
        justifyContent: 'center',
        height: 24,
        width: 24
    },

    /**
     * A special padding to avoid issues on some devices (such as Android devices with custom suggestions bar).
     */
    extraBarPadding: {
        paddingBottom: 30
    },

    invitedList: {
        padding: 3
    },

    itemLinesStyle: {
        color: 'rgb(118, 136, 152)',
        fontSize: 13
    },

    itemText: {
        color: DARK_GREY,
        fontSize: 14,
        fontWeight: 'normal'
    },

    itemWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingLeft: 5
    },

    resultList: {
        flex: 1,
        padding: 5
    },

    searchField: {
        backgroundColor: FIELD_COLOR,
        borderBottomRightRadius: 10,
        borderTopRightRadius: 10,
        color: DARK_GREY,
        flex: 1,
        fontSize: 17,
        paddingVertical: 7
    },

    selectedIcon: {
        color: DARK_GREY,
        fontSize: 20,
        marginRight: BoxModel.margin,
        padding: 2
    },

    separator: {
        borderBottomColor: LIGHT_GREY,
        borderBottomWidth: 1,
        marginLeft: 85
    },

    searchFieldWrapper: {
        alignItems: 'stretch',
        flexDirection: 'row',
        height: 52,
        paddingHorizontal: 15,
        paddingVertical: 8
    },

    searchIcon: {
        color: DARK_GREY,
        fontSize: ICON_SIZE
    },

    searchIconWrapper: {
        alignItems: 'center',
        backgroundColor: FIELD_COLOR,
        borderBottomLeftRadius: 10,
        borderTopLeftRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width: ICON_SIZE + 16
    },

    shareIcon: {
        fontSize: 42
    },

    unselectIcon: {
        color: LIGHT_GREY,
        fontSize: 16,
        left: AVATAR_SIZE / -3,
        position: 'relative',
        top: AVATAR_SIZE / -3
    }
};
