// @flow

import { BoxModel, ColorPalette } from '../../../base/styles';

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
        paddingLeft: 1.5 * BoxModel.padding
    },

    /**
     * Test style of the notification.
     */
    contentText: {
        alignSelf: 'flex-start',
        color: ColorPalette.white
    },

    /**
     * Dismiss icon style.
     */
    dismissIcon: {
        color: ColorPalette.white,
        fontSize: 20,
        padding: 1.5 * BoxModel.padding
    },

    /**
     * Outermost view of a single notification.
     */
    notification: {
        backgroundColor: '#768898',
        flexDirection: 'row',
        minHeight: 48,
        marginTop: 0.5 * BoxModel.margin
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
        flexDirection: 'column'
    }
};
