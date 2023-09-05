import { BoxModel } from '../../../../base/styles/components/styles/BoxModel';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

export const AVATAR_SIZE = 40;
export const DARK_GREY = 'rgb(28, 32, 37)';
export const LIGHT_GREY = 'rgb(209, 219, 232)';

export default {

    addPeopleContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    avatar: {
        backgroundColor: LIGHT_GREY
    },

    customContainer: {
        marginHorizontal: BaseTheme.spacing[3],
        marginVertical: BaseTheme.spacing[2]
    },

    avatarText: {
        color: DARK_GREY,
        fontSize: 12
    },

    bottomBar: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        height: BaseTheme.spacing[10]
    },

    clearButton: {
        paddingTop: 7
    },

    clearIcon: {
        color: BaseTheme.palette.ui02,
        fontSize: 18,
        textAlign: 'center'
    },

    /**
     * A special padding to avoid issues on some devices (such as Android devices with custom suggestions bar).
     */
    extraBarPadding: {
        paddingBottom: 30
    },

    headerCloseIcon: {
        marginLeft: 12
    },

    headerSendInvite: {
        color: BaseTheme.palette.text01,
        marginRight: 12
    },

    invitedList: {
        padding: 3
    },

    itemLinesStyle: {
        color: 'rgb(118, 136, 152)',
        fontSize: 13
    },

    itemText: {
        color: BaseTheme.palette.text01,
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

    selectedIcon: {
        color: BaseTheme.palette.icon01,
        fontSize: 20,
        marginRight: BoxModel.margin,
        padding: 2
    },

    separator: {
        borderBottomColor: BaseTheme.palette.ui07,
        borderBottomWidth: 1,
        marginLeft: 85
    },

    searchIcon: {
        color: BaseTheme.palette.icon01,
        fontSize: 22
    },

    shareIcon: {
        fontSize: 42
    },

    unselectIcon: {
        color: BaseTheme.palette.ui01,
        fontSize: 16,
        left: AVATAR_SIZE / -3,
        position: 'relative',
        top: AVATAR_SIZE / -3
    },

    sendBtn: {
        marginRight: BaseTheme.spacing[3]
    }
};
