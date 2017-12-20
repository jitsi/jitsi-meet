import { createStyleSheet, BoxModel } from '../../base/styles';

const AVATAR_OPACITY = 0.4;

const AVATAR_SIZE = 65;

const OVERLAY_FONT_COLOR = 'rgba(255, 255, 255, 0.6)';

export const UNDERLAY_COLOR = 'rgba(255, 255, 255, 0.2)';

/**
 * The styles of the React {@code Component}s of the feature recent-list i.e.
 * {@code RecentList}.
 */
export default createStyleSheet({

    /**
     * The style of the actual avatar.
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
     */
    avatarContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 5
    },

    /**
     * Simple {@code Text} content of the avatar (the actual initials).
     */
    avatarContent: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        color: OVERLAY_FONT_COLOR,
        fontSize: 32,
        fontWeight: '100',
        textAlign: 'center'
    },

    /**
     * List of styles of the avatar of a remote meeting (not the default
     * server). The number of colors are limited because they should match
     * nicely.
     */
    avatarRemoteServer1: {
        backgroundColor: `rgba(232, 105, 156, ${AVATAR_OPACITY})`
    },

    avatarRemoteServer2: {
        backgroundColor: `rgba(255, 198, 115, ${AVATAR_OPACITY})`
    },

    avatarRemoteServer3: {
        backgroundColor: `rgba(128, 128, 255, ${AVATAR_OPACITY})`
    },

    avatarRemoteServer4: {
        backgroundColor: `rgba(105, 232, 194, ${AVATAR_OPACITY})`
    },

    avatarRemoteServer5: {
        backgroundColor: `rgba(234, 255, 128, ${AVATAR_OPACITY})`
    },

    /**
     * The style of the conference length (if rendered).
     */
    confLength: {
        color: OVERLAY_FONT_COLOR,
        fontWeight: 'normal'
    },

    /**
     * The top level container style of the list.
     */
    container: {
        flex: 1
    },

    /**
     * Second line of the list (date). May be extended with server name later.
     */
    date: {
        color: OVERLAY_FONT_COLOR
    },

    /**
     * The style of the details container (right side) of the list.
     */
    detailsContainer: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: 2 * BoxModel.margin
    },

    /**
     * The container for an info line with an inline icon.
     */
    infoWithIcon: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },

    /**
     * The style of an inline icon in an info line.
     */
    inlineIcon: {
        color: OVERLAY_FONT_COLOR,
        marginRight: 5
    },

    /**
     * First line of the list (room name).
     */
    roomName: {
        color: OVERLAY_FONT_COLOR,
        fontSize: 18,
        fontWeight: 'bold'
    },

    /**
     * The style of one single row in the list.
     */
    row: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        padding: 8,
        paddingBottom: 0
    },

    /**
     * The style of the server name component (if rendered).
     */
    serverName: {
        color: OVERLAY_FONT_COLOR,
        fontWeight: 'normal'
    }
});
