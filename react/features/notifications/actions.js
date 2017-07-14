import {
    HIDE_NOTIFICATION,
    SHOW_NOTIFICATION
} from './actionTypes';

/**
 * Removes the notification with the passed in id.
 *
 * @param {string} uid - The unique identifier for the notification to be
 * removed.
 * @returns {{
 *     type: HIDE_NOTIFICATION,
 *     uid: string
 * }}
 */
export function hideNotification(uid) {
    return {
        type: HIDE_NOTIFICATION,
        uid
    };
}

/**
 * Queues a notification for display.
 *
 * @param {ReactComponent} component - The notification component to be
 * displayed.
 * @param {Object} props - The props needed to show the notification component.
 * @param {Object} options - Additional configuration for the notification.
 * @param {number} [options.timeout] - How long the notification should display
 * before automatically being hidden.
 * @returns {{
 *     type: SHOW_NOTIFICATION,
 *     component: ReactComponent,
 *     options: Object,
 *     props: Object,
 *     uid: number
 * }}
 */
export function showNotification(component, props = {}, options = {}) {
    return {
        type: SHOW_NOTIFICATION,
        component,
        options,
        props,
        uid: window.Date.now()
    };
}
