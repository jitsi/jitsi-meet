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

/**
 * The styles of the React {@code Components} of the feature notifications.
 */
export default {

    /**
     * The content (left) column of the notification.
     */
    interactiveContentColumn: {
        ...contentColumn
    },

    contentColumn: {
        ...contentColumn,
        justifyContent: 'center'
    },

    /**
     * Test style of the notification.
     */

    contentContainer: {
        marginTop: BaseTheme.spacing[2]
    },

    contentText: {
        ...contentText,
        marginVertical: BaseTheme.spacing[1]
    },

    contentTextInteractive: {
        ...contentText,
        marginTop: BaseTheme.spacing[1]
    },

    contentTextTitle: {
        ...contentText,
        fontWeight: 'bold',
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
        marginBottom: BaseTheme.spacing[3],
        marginHorizontal: BaseTheme.spacing[2]
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
        left: BaseTheme.spacing[1],
        position: 'absolute',
        top: BaseTheme.spacing[2]
    },

    btn: {
        marginLeft: BaseTheme.spacing[4]
    },

    btnContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: BaseTheme.spacing[1]
    }
};
