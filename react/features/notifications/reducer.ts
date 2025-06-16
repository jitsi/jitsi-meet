import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_NOTIFICATIONS,
    HIDE_NOTIFICATION,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';
import { NOTIFICATION_TYPE_PRIORITIES } from './constants';

/**
 * The initial state of the feature notifications.
 *
 * @type {array}
 */
const DEFAULT_STATE = {
    enabled: true,
    notifications: []
};

interface INotification {
    component: Object;
    props: {
        appearance?: string;
        descriptionArguments?: Object;
        descriptionKey?: string;
        titleKey: string;
    };
    timeout: number;
    uid: string;
}

export interface INotificationsState {
    enabled: boolean;
    notifications: INotification[];
}

/**
 * Reduces redux actions which affect the display of notifications.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register<INotificationsState>('features/notifications',
    (state = DEFAULT_STATE, action): INotificationsState => {
        switch (action.type) {
        case CLEAR_NOTIFICATIONS:
            return {
                ...state,
                notifications: []
            };
        case HIDE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.uid !== action.uid)
            };

        case SET_NOTIFICATIONS_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SHOW_NOTIFICATION:
            return {
                ...state,
                notifications:
                    _insertNotificationByPriority(state.notifications, {
                        component: action.component,
                        props: action.props,
                        timeout: action.timeout,
                        uid: action.uid
                    })
            };
        }

        return state;
    });

/**
 * Creates a new notification queue with the passed in notification placed at
 * the end of other notifications with higher or the same priority.
 *
 * @param {Object[]} notifications - The queue of notifications to be displayed.
 * @param {Object} notification - The new notification to add to the queue.
 * @private
 * @returns {Object[]} A new array with an updated order of the notification
 * queue.
 */
function _insertNotificationByPriority(notifications: INotification[], notification: INotification) {

    // Create a copy to avoid mutation.
    const copyOfNotifications = notifications.slice();

    // Get the index of any queued notification that has the same id as the new notification
    let insertAtLocation = copyOfNotifications.findIndex(
            (queuedNotification: INotification) =>
                queuedNotification?.uid === notification?.uid
    );

    if (insertAtLocation !== -1) {
        copyOfNotifications.splice(insertAtLocation, 1, notification);

        return copyOfNotifications;
    }

    const newNotificationPriority
        = NOTIFICATION_TYPE_PRIORITIES[notification.props.appearance ?? ''] || 0;

    // Find where to insert the new notification based on priority. Do not
    // insert at the front of the queue so that the user can finish acting on
    // any notification currently being read.
    for (let i = 1; i < notifications.length; i++) {
        const queuedNotification = notifications[i];
        const queuedNotificationPriority
            = NOTIFICATION_TYPE_PRIORITIES[queuedNotification.props.appearance ?? '']
            || 0;

        if (queuedNotificationPriority < newNotificationPriority) {
            insertAtLocation = i;
            break;
        }
    }

    copyOfNotifications.splice(insertAtLocation, 0, notification);

    return copyOfNotifications;
}
