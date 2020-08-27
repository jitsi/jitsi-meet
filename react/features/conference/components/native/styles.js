import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel, ColorPalette, fixAndroidViewClipping } from '../../../base/styles';
import { FILMSTRIP_SIZE } from '../../../filmstrip';

export const NAVBAR_GRADIENT_COLORS = [ '#000000FF', '#00000000' ];
export const INSECURE_ROOM_NAME_LABEL_COLOR = ColorPalette.warning;

// From brand guideline
const BOTTOM_GRADIENT_HEIGHT = 290;
const DEFAULT_GRADIENT_SIZE = 140;

/**
 * The styles of the feature conference.
 */
export default {

    bottomGradient: {
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: DEFAULT_GRADIENT_SIZE,
        left: 0,
        position: 'absolute',
        right: 0
    },

    /**
     * {@code Conference} style.
     */
    conference: fixAndroidViewClipping({
        alignSelf: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        flex: 1
    }),

    displayNameContainer: {
        margin: 10
    },

    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flex: 1
    },

    gradientStretchBottom: {
        height: BOTTOM_GRADIENT_HEIGHT
    },

    gradientStretchTop: {
        height: DEFAULT_GRADIENT_SIZE
    },

    /**
     * View that contains the indicators.
     */
    indicatorContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        margin: BoxModel.margin
    },

    /**
     * Indicator container for wide aspect ratio.
     */
    indicatorContainerWide: {
        marginRight: FILMSTRIP_SIZE + BoxModel.margin
    },

    labelWrapper: {
        flexDirection: 'column',
        position: 'absolute',
        right: 0,
        top: 0
    },

    lonelyButton: {
        alignItems: 'center',
        borderRadius: 24,
        flexDirection: 'row',
        height: 48,
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

    navBarButton: {
        iconStyle: {
            color: ColorPalette.white,
            fontSize: 24
        },

        underlayColor: 'transparent'
    },

    navBarContainer: {
        flexDirection: 'column',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
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
        justifyContent: 'space-between',
        paddingHorizontal: 14
    },

    roomTimer: {
        color: ColorPalette.white,
        fontSize: 15,
        opacity: 0.6
    },

    roomName: {
        color: ColorPalette.white,
        fontSize: 17,
        fontWeight: '400'
    },

    roomNameWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        left: 0,
        paddingHorizontal: 48,
        position: 'absolute',
        right: 0
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
        paddingBottom: BoxModel.padding,
        position: 'absolute',
        right: 0,

        // Both on Android and iOS there is the status bar which may be visible.
        // On iPhone X there is the notch. In the two cases BoxModel.margin is
        // not enough.
        top: BoxModel.margin * 3
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
