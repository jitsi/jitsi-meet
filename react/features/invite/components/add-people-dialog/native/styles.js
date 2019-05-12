// @flow

import { ColorPalette } from '../../../../base/styles';

export const AVATAR_SIZE = 40;
export const DARK_GREY = 'rgb(28, 32, 37)';
export const LIGHT_GREY = 'rgb(209, 219, 232)';
export const ICON_SIZE = 15;

export default {
    avatar: {
        backgroundColor: LIGHT_GREY
    },

    avatarText: {
        color: 'rgb(28, 32, 37)',
        fontSize: 12
    },

    dialogWrapper: {
        alignItems: 'stretch',
        backgroundColor: ColorPalette.white,
        flex: 1,
        flexDirection: 'column'
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

    radioButton: {
        color: DARK_GREY,
        fontSize: 16,
        padding: 2
    },

    resultList: {
        padding: 5
    },

    searchField: {
        backgroundColor: 'rgb(240, 243, 247)',
        borderBottomRightRadius: 10,
        borderTopRightRadius: 10,
        flex: 1,
        fontSize: 17,
        paddingVertical: 7
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
        backgroundColor: 'rgb(240, 243, 247)',
        borderBottomLeftRadius: 10,
        borderTopLeftRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width: ICON_SIZE + 16
    }
};
