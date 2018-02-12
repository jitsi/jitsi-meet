import { createStyleSheet } from '../../base/styles';

const AVATAR_OPACITY = 0.4;
const AVATAR_SIZE = 65;
const NOTIFICATION_SIZE = 55;
const OVERLAY_FONT_COLOR = 'rgba(255, 255, 255, 0.6)';

export const UNDERLAY_COLOR = 'rgba(255, 255, 255, 0.2)';

/**
 * The styles of the React {@code Component}s of the feature recent-list i.e.
 * {@code RecentList}.
 */
export default createStyleSheet({

    /**
     * The style of the actual avatar.
     * Recent-list copy!
     */
    avatar: {
        alignItems: 'center',
        backgroundColor: `rgba(23, 160, 219, ${AVATAR_OPACITY})`,
        borderRadius: AVATAR_SIZE,
        height: AVATAR_SIZE,
        justifyContent: 'center',
        width: AVATAR_SIZE
    },

    /**
     * The style of the avatar container that makes the avatar rounded.
     * Recent-list copy!
     */
    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 5
    },

    /**
     * Simple {@code Text} content of the avatar (the actual initials).
     * Recent-list copy!
     */
    avatarContent: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        color: OVERLAY_FONT_COLOR,
        fontSize: 32,
        fontWeight: '100',
        textAlign: 'center'
    },

    /**
     * Style for the actual notification content.
     */
    notificationContainer: {
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

    notificationIconContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: NOTIFICATION_SIZE,
        justifyContent: 'center'
    },

    notificationText: {
        color: 'white',
        fontSize: 13
    },

    notificationTextContainer: {
        flexDirection: 'column',
        height: NOTIFICATION_SIZE,
        justifyContent: 'center'
    },

    /**
     * The top level container style of the list.
     */
    container: {
        flex: 1
    },

    /**
     * Shows the container disabled.
     */
    containerDisabled: {
        opacity: 0.2
    },

    list: {
        flex: 1,
        flexDirection: 'column'
    },

    listItem: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 5
    },

    listItemDetails: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
        paddingHorizontal: 5
    },

    listItemText: {
        color: OVERLAY_FONT_COLOR,
        fontSize: 16
    },

    listItemTitle: {
        fontWeight: 'bold',
        fontSize: 18
    },

    listSection: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flex: 1,
        flexDirection: 'row',
        padding: 5
    },

    listSectionText: {
        color: OVERLAY_FONT_COLOR,
        fontSize: 14,
        fontWeight: 'normal'
    },

    touchableView: {
        flexDirection: 'row'
    }
});
