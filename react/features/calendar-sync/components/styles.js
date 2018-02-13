import { createStyleSheet } from '../../base/styles';

const NOTIFICATION_SIZE = 55;

/**
 * The styles of the React {@code Component}s of the feature meeting-list i.e.
 * {@code MeetingList}.
 */
export default createStyleSheet({

    /**
     * The top level container of the notification.
     */
    notificationContainer: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'absolute'
    },

    /**
     * Additional style for the container when the notification is displayed
     * on the side (narrow view).
     */
    notificationContainerSide: {
        top: 100
    },

    /**
     * Additional style for the container when the notification is displayed
     * on the top (wide view).
     */
    notificationContainerTop: {
        justifyContent: 'center',
        left: 0,
        right: 0,
        top: 0
    },

    /**
     * The top level container of the notification.
     */
    notificationContent: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        height: NOTIFICATION_SIZE,
        justifyContent: 'center',
        paddingHorizontal: 10
    },

    /**
     * Color for upcoming meeting notification.
     */
    notificationContentNext: {
        backgroundColor: '#eeb231'
    },

    /**
     * Color for already ongoing meeting notifications.
     */
    notificationContentPast: {
        backgroundColor: 'red'
    },

    /**
     * Additional style for the content when the notification is displayed
     * on the side (narrow view).
     */
    notificationContentSide: {
        borderBottomRightRadius: NOTIFICATION_SIZE,
        borderTopRightRadius: NOTIFICATION_SIZE
    },

    /**
     * Additional style for the content when the notification is displayed
     * on the top (wide view).
     */
    notificationContentTop: {
        borderBottomLeftRadius: NOTIFICATION_SIZE / 2,
        borderBottomRightRadius: NOTIFICATION_SIZE / 2,
        paddingHorizontal: 20
    },

    /**
     * The icon of the notification.
     */
    notificationIcon: {
        color: 'white',
        fontSize: 25
    },

    /**
     * The container that contains the icon.
     */
    notificationIconContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: NOTIFICATION_SIZE,
        justifyContent: 'center'
    },

    /**
     * A single line of text of the notification.
     */
    notificationText: {
        color: 'white',
        fontSize: 13
    },

    /**
     * The container for all the lines if the norification.
     */
    notificationTextContainer: {
        flexDirection: 'column',
        height: NOTIFICATION_SIZE,
        justifyContent: 'center'
    },

    /**
     * The touchable component.
     */
    touchableView: {
        flexDirection: 'row'
    }
});
