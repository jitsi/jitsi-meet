// @flow

import { NativeModules, Platform } from 'react-native';
import VIForegroundService from '@voximplant/react-native-foreground-service';

import { getCurrentConference } from '../../base/conference';
import { StateListenerRegistry } from '../../base/redux';

/**
 * Application information module.
 */
const { AppInfo } = NativeModules;

/**
 * Name for the notification channel used for ongoing meeting notifications.
 */
const CHANNEL_ID = 'JitsiNotificationChannel';

/**
 * Configuration for the notification channel (required in Android O+).
 * See: https://developer.android.com/training/notify-user/channels
 */
const channelConfig = {
    enableVibration: false,
    description: 'Notification Channel for in-call Foreground Service',
    id: CHANNEL_ID,
    importance: 3, // IMPORTANCE_DEFAULT
    name: 'Notification Channel'
};

/**
 * Configuration for the ongoing notification.
 */
const notificationConfig = {
    channelId: CHANNEL_ID,
    icon: 'ic_notification',
    id: Math.floor(Math.random() * 10000),
    priority: 0, // PRIORITY_DEFAULT
    text: `You are currently in a meeting. Tap to return to ${AppInfo.name}.`,
    title: 'Ongoing meeting'
};

/**
 * Indicates whether the notification channel was created or not. It must be created only once.
 */
let channelCreated = false;

/**
 * StateListenerRegistry provides a reliable way to detect the leaving of a
 * conference, where we need to clean up the recording sessions.
 */
Platform.OS === 'android' && StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ conference => {
        startStopService(conference);
    }
);

/**
 * Starts or stops the foreground service based on the presence of an active conference.
 *
 * @param {*} conference - The current active conference.
 * @returns {Promise}
 */
async function startStopService(conference) {
    if (conference) {
        // Android >= Oreo (26) requires the notification channel.

        if (Platform.Version >= 26 && !channelCreated) {
            await VIForegroundService.createNotificationChannel(channelConfig);
            channelCreated = true;
        }

        // Start the service.
        try {
            await VIForegroundService.startService(notificationConfig);
        } catch (e) {
            console.error(e);
        }
    } else {
        await VIForegroundService.stopService();
    }
}
