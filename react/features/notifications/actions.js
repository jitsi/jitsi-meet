import jitsiLocalStorage from '../../../modules/util/JitsiLocalStorage';

import {
    HIDE_NOTIFICATION,
    SHOW_NOTIFICATION
} from './actionTypes';
import { NotificationWithToggle } from './components';

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
 * Displays a notification unless the passed in persistenceKey value exists in
 * local storage and has been set to "true".
 *
 * @param {string} persistenceKey - The local storage key to look up for whether
 * or not the notification should display.
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Function}
 */
export function maybeShowNotificationWithDoNotDisplay(persistenceKey, props) {
    return dispatch => {
        if (jitsiLocalStorage.getItem(persistenceKey) === 'true') {
            return;
        }

        const newProps = Object.assign({}, props, {
            onToggleSubmit: isToggled => {
                jitsiLocalStorage.setItem(persistenceKey, isToggled);
            }
        });

        dispatch({
            type: SHOW_NOTIFICATION,
            component: NotificationWithToggle,
            props: newProps,
            uid: window.Date.now()
        });
    };
}
