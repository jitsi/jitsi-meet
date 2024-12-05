import { IReduxState } from '../../app/types';
import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus } from '@notifee/react-native';
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

    // Foreground service needs to be registered first
    notifee.registerForegroundService(() => {
        return new Promise(() => {
            logger.warn('Foreground service running');
        });
    });

    // Request permissions
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

    // Display notification
    await notifee.displayNotification({
        title: '<p style="color: #4caf50;"><b>Ongoing conference</span></p></b></p> &#128576;',
        subtitle: '&#129395;',
        body:
            'Meeting <p style="text-decoration: line-through">you are </p> participating <p style="color: #ffffff; background-color: #9c27b0"><i>is ongoing</i></p> &#127881;!',
        android: {
            asForegroundService: true,
            autoCancel: false,
            channelId,
            importance: AndroidImportance.HIGH,
            color: '#4caf50',
            ongoing: true,
            actions: [
                {
                    title: '<b>Dance</b> &#128111;',
                    pressAction: { id: 'dance' },
                },
                {
                    title: '<p style="color: #f44336;"><b>Cry</b> &#128557;</p>',
                    pressAction: { id: 'cry' },
                },
            ],
        },
    } as Notification);
}

export async function stopForegroundService() {
    try {
        await notifee.stopForegroundService();
    } catch (err) {
        console.log(err);
    }
}
