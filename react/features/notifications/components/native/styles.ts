import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const contentColumn = {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: BaseTheme.spacing[2]
};

const notification = {
    backgroundColor: BaseTheme.palette.ui10,
    borderRadius: BaseTheme.shape.borderRadius,
    borderLeftColor: BaseTheme.palette.link01Active,
    borderLeftWidth: BaseTheme.spacing[1],
    display: 'flex',
    flexDirection: 'row',
    marginVertical: BaseTheme.spacing[1],
    maxWidth: 416,
    width: '100%'
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
        paddingHorizontal: BaseTheme.spacing[2]
    },

    contentText: {
        color: BaseTheme.palette.text04,
        paddingLeft: BaseTheme.spacing[5],
        paddingTop: BaseTheme.spacing[1]
    },

    contentTextTitle: {
        color: BaseTheme.palette.text04,
        fontWeight: 'bold',
        paddingLeft: BaseTheme.spacing[5],
        paddingTop: BaseTheme.spacing[2]
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
        position: 'absolute',
        left: BaseTheme.spacing[2],
        top: 12
    },

    btn: {
        paddingLeft: BaseTheme.spacing[3]
    },

    btnContainer: {
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: BaseTheme.spacing[4],
        paddingTop: BaseTheme.spacing[1]
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
