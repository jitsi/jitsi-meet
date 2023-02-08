// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const contentColumn = {
    flex: 1,
    flexDirection: 'column',
    marginLeft: BaseTheme.spacing[2]
};

const contentText = {
    color: BaseTheme.palette.text04,
    marginLeft: BaseTheme.spacing[6]
};

const iconContainer = {
    position: 'absolute',
    left: BaseTheme.spacing[1]
};

/**
 * The styles of the React {@code Components} of the feature notifications.
 */
export default {

    /**
     * The content (left) column of the notification.
     */
    contentColumn: {
        ...contentColumn
    },

    interactiveContentColumn: {
        ...contentColumn,
        justifyContent: 'center'
    },

    /**
     * Test style of the notification.
     */
    contentText: {
        ...contentText
    },

    contentTextInteractive: {
        ...contentText,
        marginTop: BaseTheme.spacing[1]
    },

    /**
     * Dismiss icon style.
     */
    dismissIcon: {
        color: BaseTheme.palette.icon04,
        fontSize: 20
    },

    notification: {
        display: 'flex',
        backgroundColor: BaseTheme.palette.ui12,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        maxHeight: 104,
        height: 'auto',
        marginBottom: BaseTheme.spacing[5],
        marginHorizontal: BaseTheme.spacing[2]
    },

    /**
     * Outermost container of a list of notifications.
     */
    notificationContainer: {
        flexGrow: 0,
        justifyContent: 'flex-end'
    },

    /**
     * Wrapper for the message.
     */
    notificationContent: {
        alignItems: 'center',
        flexDirection: 'row'
    },

    participantName: {
        color: BaseTheme.palette.text04,
        overflow: 'hidden'
    },

    iconContainer: {
        ...iconContainer
    },

    iconContainerInteractive: {
        ...iconContainer,
        top: BaseTheme.spacing[2]
    },

    btnContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: BaseTheme.spacing[4]
    },

    avatarContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        marginTop: BaseTheme.spacing[1]
    },

    avatarText: {
        color: BaseTheme.palette.text04,
        fontWeight: 'bold',
        marginLeft: BaseTheme.spacing[2]
    }
};
