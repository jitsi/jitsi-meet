// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the React {@code Components} of the feature notifications.
 */
export default {

    /**
     * The content (left) column of the notification.
     */
    contentColumn: {
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'column',
        marginLeft: BaseTheme.spacing[2]
    },

    /**
     * Test style of the notification.
     */
    contentText: {
        color: BaseTheme.palette.text04,
        marginLeft: BaseTheme.spacing[6],
        position: 'relative'
    },

    /**
     * Dismiss icon style.
     */
    dismissIcon: {
        color: BaseTheme.palette.icon04,
        fontSize: 20
    },

    /**
     * Outermost view of a single notification.
     */
    notification: {
        alignItems: 'center',
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
        position: 'absolute',
        left: BaseTheme.spacing[2]
    },

    btnLabel: {
        color: BaseTheme.palette.link01
    },

    btnContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: BaseTheme.spacing[4]
    },

    rejectBtnLabel: {
        color: BaseTheme.palette.actionDanger
    },

    avatarContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        marginTop: BaseTheme.spacing[2]
    },

    avatarText: {
        color: BaseTheme.palette.text04,
        fontWeight: 'bold',
        marginLeft: BaseTheme.spacing[2]
    }
};
