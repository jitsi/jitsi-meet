import {
    HIDE_NOTIFICATION,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';
import { Notification } from './components';

import { NOTIFICATION_TYPE } from './constants';

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
export function hideNotification(uid) {
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
export function setNotificationsEnabled(enabled) {
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
export function showErrorNotification(props) {
    return showNotification(Notification, {
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    });
}

/**
 * Queues a notification for display.
 *
 * @param {ReactComponent} component - The notification component to be
 * displayed.
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {{
 *     type: SHOW_NOTIFICATION,
 *     component: ReactComponent,
 *     props: Object,
 *     timeout: number,
 *     uid: number
 * }}
 */
export function showNotification(component, props = {}, timeout) {
    return {
        type: SHOW_NOTIFICATION,
        component,
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
export function showWarningNotification(props) {
    return showNotification(Notification, {
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    });
}
