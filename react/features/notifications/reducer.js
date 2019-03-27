// @flow

import { ReducerRegistry } from '../base/redux';

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

/**
 * Reduces redux actions which affect the display of notifications.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register('features/notifications',
    (state = DEFAULT_STATE, action) => {
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
function _insertNotificationByPriority(notifications, notification) {
    const newNotificationPriority
        = NOTIFICATION_TYPE_PRIORITIES[notification.props.appearance] || 0;

    // Default to putting the new notification at the end of the queue.
    let insertAtLocation = notifications.length;

    // Find where to insert the new notification based on priority. Do not
    // insert at the front of the queue so that the user can finish acting on
    // any notification currently being read.
    for (let i = 1; i < notifications.length; i++) {
        const queuedNotification = notifications[i];
        const queuedNotificationPriority
            = NOTIFICATION_TYPE_PRIORITIES[queuedNotification.props.appearance]
                || 0;

        if (queuedNotificationPriority < newNotificationPriority) {
            insertAtLocation = i;
            break;
        }
    }

    // Create a copy to avoid mutation and insert the notification.
    const copyOfNotifications = notifications.slice();

    copyOfNotifications.splice(insertAtLocation, 0, notification);

    return copyOfNotifications;
}
