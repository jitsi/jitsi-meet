import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const contentColumn = {
    flex: 1,
    flexDirection: 'column',
    marginLeft: BaseTheme.spacing[2]
};

const notification = {
    display: 'flex',
    backgroundColor: BaseTheme.palette.ui10,
    borderRadius: BaseTheme.shape.borderRadius,
    borderLeftColor: BaseTheme.palette.link01Active,
    borderLeftWidth: 4,
    flexDirection: 'row',
    maxHeight: 120,
    height: 'auto',
    marginBottom: BaseTheme.spacing[2],
    marginHorizontal: BaseTheme.spacing[2],
    maxWidth: 400,
    width: 'auto'
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
        color: BaseTheme.palette.text04,
        marginLeft: BaseTheme.spacing[6],
        marginTop: BaseTheme.spacing[1]
    },

    contentTextTitle: {
        color: BaseTheme.palette.text04,
        marginLeft: BaseTheme.spacing[6],
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
        ...notification
    },

    notificationWithDescription: {
        ...notification,
        paddingBottom: BaseTheme.spacing[2]
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
    },

    withToolbox: {
        bottom: 56,
        position: 'absolute',
        width: '100%'
    },

    withToolboxTileView: {
        bottom: 56,
        position: 'absolute',
        width: '100%'
    },

    withoutToolbox: {
        position: 'absolute',
        width: '100%'
    },

    withoutToolboxTileView: {
        bottom: 0,
        position: 'absolute',
        width: '100%'
    }
};
