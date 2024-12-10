import { IReduxState } from '../../app/types';
import notifee, {AndroidImportance, AndroidVisibility, AuthorizationStatus, EventType} from '@notifee/react-native';
import logger from "../../app/logger";

export * from './functions.any';

/**
 * Returns whether the conference is in connecting state.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} Whether conference is connecting.
 */
export const isConnecting = (state: IReduxState) => {
    const { connecting, connection } = state['features/base/connection'];
    const {
        conference,
        joining,
        membersOnly,
        leaving
    } = state['features/base/conference'];

    // XXX There is a window of time between the successful establishment of the
    // XMPP connection and the subsequent commencement of joining the MUC during
    // which the app does not appear to be doing anything according to the redux
    // state. In order to not toggle the _connecting props during the window of
    // time in question, define _connecting as follows:
    // - the XMPP connection is connecting, or
    // - the XMPP connection is connected and the conference is joining, or
    // - the XMPP connection is connected and we have no conference yet, nor we
    //   are leaving one.
    return Boolean(
        connecting || (connection && (!membersOnly && (joining || (!conference && !leaving))))
    );
};

export async function displayNotificationAsForegroundService() {

    // Request permissions if not authorized
    const currentPermissions = await notifee.getNotificationSettings();

    if (currentPermissions.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        await notifee.requestPermission();
    }

    // Create notification channel
    const channelId = await notifee.createChannel({
        id: 'ongoing-channel',
        name: 'Ongoing channel',
        visibility: AndroidVisibility.PUBLIC
    });

    // Display notification as a foreground service
    await notifee.displayNotification({
        title: 'Ongoing conference',
        body:
            'Meeting you are participating is ongoing.',
        android: {
            asForegroundService: true,
            autoCancel: false,
            channelId,
            importance: AndroidImportance.HIGH,
            ongoing: true,
            smallIcon: 'ic_notification',
            actions: [
                {
                    title: 'Hang Up',
                    pressAction: {
                        id: 'hang-up'
                    },
                },
            ],
        },
    } as Notification);
}

export async function stopForegroundService() {
    try {
        await notifee.stopForegroundService();
        logger.warn('Foreground service stopped.')
    } catch (err) {
        logger.error(err);
    }
}
