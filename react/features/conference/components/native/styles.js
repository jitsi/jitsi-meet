import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel, fixAndroidViewClipping } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const INSECURE_ROOM_NAME_LABEL_COLOR = BaseTheme.palette.warning03;

const NAVBAR_BUTTON_SIZE = 24;

/**
 * The styles of the feature conference.
 */
export default {

    /**
     * {@code Conference} Style.
     */
    conference: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1
    }),

    displayNameContainer: {
        margin: 10
    },

    headerNavigationIcon: {
        marginLeft: 12
    },

    headerNavigationButton: {
        height: BaseTheme.spacing[6],
        marginTop: BaseTheme.spacing[3],
        width: BaseTheme.spacing[6]
    },

    /**
     * View that contains the indicators.
     */
    indicatorContainer: {
        flex: 1,
        flexDirection: 'row'
    },

    inviteButtonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1
    },

    inviteButton: {
        iconStyle: {
            padding: 10,
            color: BaseTheme.palette.icon01,
            fontSize: NAVBAR_BUTTON_SIZE
        },
        underlayColor: BaseTheme.spacing.underlay01
    },

    lonelyButton: {
        alignItems: 'center',
        borderRadius: 24,
        flexDirection: 'row',
        height: BaseTheme.spacing[6],
        justifyContent: 'space-around',
        paddingHorizontal: 12
    },

    lonelyButtonComponents: {
        marginHorizontal: 6
    },

    lonelyMeetingContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        padding: BoxModel.padding * 2
    },

    lonelyMessage: {
        paddingVertical: 12
    },

    pipButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
    },

    pipButton: {
        iconStyle: {
            padding: 10,
            color: BaseTheme.palette.icon01,
            fontSize: NAVBAR_BUTTON_SIZE
        },
        underlayColor: BaseTheme.palette.underlay01
    },

    navBarSafeView: {
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    navBarWrapper: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: 14
    },

    roomTimer: {
        color: BaseTheme.palette.text01,
        fontSize: 12,
        fontWeight: '400',
        paddingHorizontal: 8
    },

    roomTimerView: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderBottomRightRadius: 3,
        borderTopRightRadius: 3,
        height: 28,
        justifyContent: 'center',
        minWidth: 50
    },

    roomName: {
        color: BaseTheme.palette.text01,
        fontSize: 14,
        fontWeight: '400'
    },

    roomNameView: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderBottomLeftRadius: 3,
        borderTopLeftRadius: 3,
        flexShrink: 1,
        height: 28,
        justifyContent: 'center',
        paddingHorizontal: 10
    },

    roomNameWrapper: {
        flexDirection: 'row',
        marginHorizontal: 35
    },

    /**
     * The style of the {@link View} which expands over the whole
     * {@link Conference} area and splits it between the {@link Filmstrip} and
     * the {@link Toolbox}.
     */
    toolboxAndFilmstripContainer: {
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    insecureRoomNameLabel: {
        backgroundColor: INSECURE_ROOM_NAME_LABEL_COLOR
    }
};

ColorSchemeRegistry.register('Conference', {
    lonelyButton: {
        backgroundColor: schemeColor('inviteButtonBackground')
    },

    lonelyMessage: {
        color: schemeColor('onVideoText')
    }
});
