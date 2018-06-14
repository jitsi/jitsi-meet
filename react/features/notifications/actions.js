// @flow

import {
    CLEAR_NOTIFICATIONS,
    HIDE_NOTIFICATION,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';

import { NOTIFICATION_TYPE } from './constants';

/**
 * Clears (removes) all the notifications.
 *
 * @returns {{
 *     type: CLEAR_NOTIFICATIONS
 * }}
 */
export function clearNotifications() {
    return {
        type: CLEAR_NOTIFICATIONS
    };
}

/**
 * Removes the notification with the passed in id.
 *
 * @param {string} uid - The unique identifier for the notification to be
 * removed.
 * @returns {{
 *     type: HIDE_NOTIFICATION,
 *     uid: number
 * }}
 */
export function hideNotification(uid: number) {
    return {
        type: HIDE_NOTIFICATION,
        uid
    };
}

/**
 * Stops notifications from being displayed.
 *
 * @param {boolean} enabled - Whether or not notifications should display.
 * @returns {{
 *     type: SET_NOTIFICATIONS_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setNotificationsEnabled(enabled: boolean) {
    return {
        type: SET_NOTIFICATIONS_ENABLED,
        enabled
    };
}

/**
 * Queues an error notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function showErrorNotification(props: Object) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    });
}

/**
 * Queues a notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {{
 *     type: SHOW_NOTIFICATION,
 *     props: Object,
 *     timeout: number,
 *     uid: number
 * }}
 */
export function showNotification(props: Object = {}, timeout: ?number) {
    return {
        type: SHOW_NOTIFICATION,
        props,
        timeout,
        uid: window.Date.now()
    };
}

/**
 * Queues a warning notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function showWarningNotification(props: Object) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    });
}
