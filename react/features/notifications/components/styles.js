// @flow

import { BoxModel, createStyleSheet, ColorPalette } from '../../base/styles';

/**
 * The styles of the React {@code Components} of the feature notifications.
 */
export default createStyleSheet({

    /**
     * The content (left) column of the notification.
     */
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        padding: BoxModel.padding
    },

    /**
     * Test style of the notification.
     */
    contentText: {
        color: ColorPalette.white
    },

    /**
     * Dismiss icon style.
     */
    dismissIcon: {
        alignSelf: 'center',
        color: ColorPalette.white,
        fontSize: 16,
        padding: 1.5 * BoxModel.padding
    },

    /**
     * Outermost view of a single notification.
     */
    notification: {
        borderRadius: 5,
        flexDirection: 'row',
        marginTop: 0.5 * BoxModel.margin
    },

    /**
     * Outermost container of a list of notifications.
     */
    notificationContainer: {
        flexGrow: 0,
        justifyContent: 'flex-end',
        padding: 2 * BoxModel.padding,
        paddingBottom: BoxModel.padding
    },

    /**
     * Wrapper for the message (without title).
     */
    notificationContent: {
        flexDirection: 'column',
        paddingVertical: 0.5 * BoxModel.padding
    },

    /**
     * The View containing the title.
     */
    notificationTitle: {
        paddingVertical: 0.5 * BoxModel.padding
    },

    /**
     * Background settings for different notification types.
     */

    notificationTypeError: {
        backgroundColor: ColorPalette.R400
    },

    notificationTypeInfo: {
        backgroundColor: ColorPalette.N500
    },

    notificationTypeNormal: {
        // NOTE: Mobile has black background when the large video doesn't render
        // a stream, so we avoid using black as the background of the normal
        // type notifications.
        backgroundColor: ColorPalette.N500
    },

    notificationTypeSuccess: {
        backgroundColor: ColorPalette.G400
    },

    notificationTypeWarning: {
        backgroundColor: ColorPalette.Y200
    },

    /**
     * Title text style.
     */
    titleText: {
        color: ColorPalette.white,
        fontWeight: 'bold'
    }
});
