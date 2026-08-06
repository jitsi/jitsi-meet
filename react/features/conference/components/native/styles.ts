import { LABEL_SIZE } from '../../../base/label/components/native/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { EXPIRED_DISK_COLOR } from '../../../time-timer/functions';

export const INSECURE_ROOM_NAME_LABEL_COLOR = BaseTheme.palette.actionDanger;

const TITLE_BAR_BUTTON_SIZE = 24;

// Collapse/expand fade duration for the time-timer pill (ms) — matches web's .6s.
export const TIME_TIMER_COLLAPSE_DURATION = 600;

// The pill matches the Record/Transcribe chips: same 28pt height (LABEL_SIZE)
// and 8pt horizontal padding (spacing[2]) as their base Label, whose corners
// use a 3pt radius.
const TIME_TIMER_DISK_SIZE = 20;
const TIME_TIMER_RADIUS = 3;
const TIME_TIMER_PAD_X = BaseTheme.spacing[2];


/**
 * The styles of the safe area view that contains the title bar.
 */
const titleBarSafeView = {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
};

const alwaysOnTitleBar = {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, .5)',
    borderRadius: BaseTheme.shape.borderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: BaseTheme.spacing[3],
    paddingRight: BaseTheme.spacing[0],
    '&:not(:empty)': {
        padding: BaseTheme.spacing[1]
    }
};

/**
 * The styles of the feature conference.
 */
export default {

    /**
     * {@code Conference} Style.
     */
    conference: {
        alignSelf: 'stretch',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1
    },

    displayNameContainer: {
        margin: BaseTheme.spacing[3]
    },

    /**
     * View that contains the indicators.
     */
    indicatorContainer: {
        flex: 1,
        flexDirection: 'row'
    },

    titleBarButtonContainer: {
        borderRadius: 3,
        height: BaseTheme.spacing[7],
        marginTop: BaseTheme.spacing[1],
        marginRight: BaseTheme.spacing[1],
        zIndex: 1,
        width: BaseTheme.spacing[7]
    },

    titleBarButton: {
        iconStyle: {
            color: BaseTheme.palette.icon01,
            padding: 12,
            fontSize: TITLE_BAR_BUTTON_SIZE
        },
        underlayColor: 'transparent'
    },

    lonelyMeetingContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        padding: BaseTheme.spacing[3]
    },

    lonelyMessage: {
        color: BaseTheme.palette.text01,
        paddingVertical: BaseTheme.spacing[2]
    },

    pipButtonContainer: {
        '&:not(:empty)': {
            borderRadius: 3,
            height: BaseTheme.spacing[7],
            marginTop: BaseTheme.spacing[1],
            marginLeft: BaseTheme.spacing[1],
            zIndex: 1,
            width: BaseTheme.spacing[7]
        }
    },

    pipButton: {
        iconStyle: {
            color: BaseTheme.palette.icon01,
            padding: 12,
            fontSize: TITLE_BAR_BUTTON_SIZE
        },
        underlayColor: 'transparent'
    },

    titleBarSafeViewColor: {
        ...titleBarSafeView,
        backgroundColor: BaseTheme.palette.uiBackground
    },

    titleBarSafeViewTransparent: {
        ...titleBarSafeView
    },

    titleBarWrapper: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        height: BaseTheme.spacing[8],
        justifyContent: 'center'
    },

    alwaysOnTitleBar: {
        ...alwaysOnTitleBar,
        marginRight: BaseTheme.spacing[2]
    },

    alwaysOnTitleBarWide: {
        ...alwaysOnTitleBar,
        marginRight: BaseTheme.spacing[12]
    },

    expandedLabelWrapper: {
        zIndex: 1
    },

    roomTimer: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        lineHeight: 14,
        textAlign: 'center'
    },

    roomTimerView: {
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 32,
        justifyContent: 'center',
        paddingHorizontal: BaseTheme.spacing[2],
        paddingVertical: BaseTheme.spacing[1],
        minWidth: 50
    },

    roomName: {
        color: BaseTheme.palette.text01,
        ...BaseTheme.typography.bodyShortBold,
        paddingVertical: 6
    },

    roomNameView: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderBottomLeftRadius: 3,
        borderTopLeftRadius: 3,
        flexShrink: 1,
        justifyContent: 'center',
        paddingHorizontal: 10
    },

    roomNameWrapper: {
        flexDirection: 'row',
        marginRight: 10,
        marginLeft: 8,
        flexShrink: 1,
        flexGrow: 1
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
        backgroundColor: INSECURE_ROOM_NAME_LABEL_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 32
    },

    raisedHandsCountLabel: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[0],
        marginLeft: BaseTheme.spacing[0]
    },

    raisedHandsCountLabelText: {
        color: BaseTheme.palette.uiBackground,
        paddingLeft: BaseTheme.spacing[2]
    },

    // Red frame around the conference area when the meeting runs past its
    // scheduled end. borderRadius is applied inline (SCREEN_CORNER_RADIUS).
    // A circular curve matches the hardware screen corner; a continuous
    // (squircle) curve renders visually tighter than the bezel and leaves a gap.
    timerExpiredFrame: {
        borderColor: EXPIRED_DISK_COLOR,
        borderCurve: 'circular',
        borderWidth: 3,
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1000
    },

    // Two-segment time-timer pill. The rounded corners live on each segment
    // (not on the row via overflow: hidden, which RN doesn't clip reliably),
    // so the left segment rounds its left corners and the right its right.
    timeTimerContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: LABEL_SIZE,
        marginBottom: 0,
        marginRight: BaseTheme.spacing[1]
    },

    // Left segment: scheduled duration.
    timeTimerScheduledSegment: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderBottomLeftRadius: TIME_TIMER_RADIUS,
        borderTopLeftRadius: TIME_TIMER_RADIUS,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: TIME_TIMER_PAD_X
    },

    timeTimerScheduledText: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.text01
    },

    // Right segment: elapsed time + disk.
    timeTimerTimerSegment: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderBottomRightRadius: TIME_TIMER_RADIUS,
        borderTopRightRadius: TIME_TIMER_RADIUS,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: TIME_TIMER_PAD_X
    },

    timeTimerElapsedText: {
        ...BaseTheme.typography.labelRegular,
        marginRight: BaseTheme.spacing[2]
    },

    // Collapsed chip — the disk alone in a rounded square, shown when the
    // toolbox hides (web's retracted state).
    timeTimerCollapsedChip: {
        alignItems: 'center',
        borderRadius: TIME_TIMER_RADIUS,
        height: LABEL_SIZE,
        justifyContent: 'center',
        marginBottom: 0,
        marginRight: BaseTheme.spacing[1],
        paddingHorizontal: TIME_TIMER_PAD_X
    }
};

// Disk diameter for the time-timer pill. Exported for the component to size
// the shared Disk to the pill.
export const TIME_TIMER_DISK = TIME_TIMER_DISK_SIZE;
