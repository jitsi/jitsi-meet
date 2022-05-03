import BaseTheme from '../../../../../base/ui/components/BaseTheme';

export const ICON_ACTIVE_COLOR = BaseTheme.palette.icon01;

export const ICON_INACTIVE_COLOR = BaseTheme.palette.icon03;

/**
 * The styles navigation components.
 */
export default {

    navigationThumbContainer: {
        alignSelf: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 13,
        height: 8,
        flex: 1
    },

    navigationThumbIcon: {
        marginRight: 10
    },

    tabBarOptions: {
        tabBarStyle: {
            display: 'none'
        }
    }

};
