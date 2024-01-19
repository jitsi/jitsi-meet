import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * The size of the microphone icon.
 */
const MICROPHONE_SIZE = 180;

/**
 * The styles of the safe area view that contains the title bar.
 */
const titleBarSafeView = {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
};

/**
 * The styles of the native components of Carmode.
 */
export default {

    bottomContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bottom: BaseTheme.spacing[8]
    },

    /**
     * {@code Conference} Style.
     */
    conference: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        justifyContent: 'center'
    },

    microphoneStyles: {
        container: {
            borderRadius: MICROPHONE_SIZE / 2,
            height: MICROPHONE_SIZE,
            maxHeight: MICROPHONE_SIZE,
            justifyContent: 'center',
            overflow: 'hidden',
            width: MICROPHONE_SIZE,
            maxWidth: MICROPHONE_SIZE,
            flex: 1,
            zIndex: 1,
            elevation: 1
        },

        icon: {
            color: BaseTheme.palette.text01,
            fontSize: MICROPHONE_SIZE * 0.45,
            fontWeight: '100'
        },

        iconContainer: {
            alignItems: 'center',
            alignSelf: 'stretch',
            flex: 1,
            justifyContent: 'center',
            backgroundColor: BaseTheme.palette.ui03
        },

        unmuted: {
            borderWidth: 4,
            borderColor: BaseTheme.palette.success01
        }
    },

    qualityLabelContainer: {
        borderRadius: BaseTheme.shape.borderRadius,
        flexShrink: 1,
        paddingHorizontal: 2,
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[2]
    },

    roomTimer: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        textAlign: 'center'
    },

    titleView: {
        width: 152,
        height: 28,
        backgroundColor: BaseTheme.palette.ui02,
        borderRadius: 12,
        alignSelf: 'center'
    },

    title: {
        margin: 'auto',
        textAlign: 'center',
        paddingVertical: BaseTheme.spacing[1],
        paddingHorizontal: BaseTheme.spacing[3],
        color: BaseTheme.palette.text02
    },

    soundDeviceButton: {
        marginBottom: BaseTheme.spacing[3],
        width: 240
    },

    endMeetingButton: {
        width: 240
    },

    headerLabels: {
        borderBottomLeftRadius: 3,
        borderTopLeftRadius: 3,
        flexShrink: 1,
        paddingHorizontal: 2,
        justifyContent: 'center'
    },

    titleBarSafeViewColor: {
        ...titleBarSafeView,
        backgroundColor: BaseTheme.palette.uiBackground
    },

    microphoneContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    titleBarWrapper: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },

    roomNameWrapper: {
        flexDirection: 'row',
        marginRight: BaseTheme.spacing[2],
        flexShrink: 1,
        flexGrow: 1
    },

    roomNameView: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexShrink: 1,
        justifyContent: 'center',
        paddingHorizontal: BaseTheme.spacing[2]
    },

    roomName: {
        color: BaseTheme.palette.text01,
        ...BaseTheme.typography.bodyShortBold
    },

    titleBar: {
        alignSelf: 'center',
        marginTop: BaseTheme.spacing[1]
    },

    videoStoppedLabel: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[3],
        textAlign: 'center',
        width: '100%'
    },

    connectionIndicatorIcon: {
        fontSize: 20
    }
};
