// @flow

import { MODERATION_NOTIFICATIONS } from '../av-moderation/constants';
import { MEDIA_TYPE } from '../base/media';
import { toState } from '../base/redux';

declare var interfaceConfig: Object;

/**
 * Tells whether or not the notifications are enabled and if there are any
 * notifications to be displayed based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function areThereNotifications(stateful: Object | Function) {
    const state = toState(stateful);
    const { enabled, notifications } = state['features/notifications'];

    return enabled && notifications.length > 0;
}

/**
 * Tells whether join/leave notifications are enabled in interface_config.
 *
 * @returns {boolean}
 */
export function joinLeaveNotificationsDisabled() {
    return Boolean(typeof interfaceConfig !== 'undefined' && interfaceConfig?.DISABLE_JOIN_LEAVE_NOTIFICATIONS);
}

/**
 * Returns whether or not the moderation notification for the given type is displayed.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {Object | Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function isModerationNotificationDisplayed(mediaType: MEDIA_TYPE, stateful: Object | Function) {
    const state = toState(stateful);

    const { notifications } = state['features/notifications'];

    return Boolean(notifications.find(n => n.uid === MODERATION_NOTIFICATIONS[mediaType]));
}
