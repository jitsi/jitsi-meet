// @flow

import throttle from 'lodash/throttle';
import type { Dispatch } from 'redux';

import { NOTIFICATIONS_ENABLED, getFeatureFlag } from '../base/flags';
import { getParticipantCount } from '../base/participants/functions';

import {
    CLEAR_NOTIFICATIONS,
    HIDE_NOTIFICATION,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';
import {
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TIMEOUT,
    NOTIFICATION_TYPE,
    SILENT_JOIN_THRESHOLD,
    SILENT_LEFT_THRESHOLD
} from './constants';

/**
 * Function that returns notification timeout value based on notification timeout type.
 *
 * @param {string} type - Notification type.
 * @param {Object} notificationTimeouts - Config notification timeouts.
 * @returns {number}
 */
function getNotificationTimeout(type: ?string, notificationTimeouts: ?Object) {
    if (type === NOTIFICATION_TIMEOUT_TYPE.SHORT) {
        return notificationTimeouts?.short ?? NOTIFICATION_TIMEOUT.SHORT;
    } else if (type === NOTIFICATION_TIMEOUT_TYPE.MEDIUM) {
        return notificationTimeouts?.medium ?? NOTIFICATION_TIMEOUT.MEDIUM;
    } else if (type === NOTIFICATION_TIMEOUT_TYPE.LONG) {
        return notificationTimeouts?.long ?? NOTIFICATION_TIMEOUT.LONG;
    }

    return NOTIFICATION_TIMEOUT.STICKY;
}

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
 *     uid: string
 * }}
 */
export function hideNotification(uid: string) {
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
 * @param {string} type - Notification type.
 * @returns {Object}
 */
export function showErrorNotification(props: Object, type: ?string) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    }, type);
}

/**
 * Queues a notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {string} type - Notification type.
 * @returns {Function}
 */
export function showNotification(props: Object = {}, type: ?string) {
    return function(dispatch: Function, getState: Function) {
        const { notifications, notificationTimeouts } = getState()['features/base/config'];
        const enabledFlag = getFeatureFlag(getState(), NOTIFICATIONS_ENABLED, true);

        const shouldDisplay = enabledFlag
            && (!notifications
                || notifications.includes(props.descriptionKey)
                || notifications.includes(props.titleKey));

        if (shouldDisplay) {
            return dispatch({
                type: SHOW_NOTIFICATION,
                props,
                timeout: getNotificationTimeout(type, notificationTimeouts),
                uid: props.uid || window.Date.now().toString()
            });
        }
    };
}

/**
 * Queues a warning notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {string} type - Notification type.
 * @returns {Object}
 */
export function showWarningNotification(props: Object, type: ?string) {

    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    }, type);
}

/**
 * Queues a message notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {string} type - Notification type.
 * @returns {Object}
 */
export function showMessageNotification(props: Object, type: ?string) {
    return showNotification({
        ...props,
        concatText: true,
        titleKey: 'notify.chatMessages',
        appearance: NOTIFICATION_TYPE.NORMAL,
        icon: NOTIFICATION_ICON.MESSAGE
    }, type);
}

/**
 * An array of names of participants that have joined the conference. The array
 * is replaced with an empty array as notifications are displayed.
 *
 * @private
 * @type {string[]}
 */
let joinedParticipantsNames = [];

/**
 * A throttled internal function that takes the internal list of participant
 * names, {@code joinedParticipantsNames}, and triggers the display of a
 * notification informing of their joining.
 *
 * @private
 * @type {Function}
 */
const _throttledNotifyParticipantConnected = throttle((dispatch: Dispatch<any>, getState: Function) => {
    const participantCount = getParticipantCount(getState());

    // Skip join notifications altogether for large meetings.
    if (participantCount > SILENT_JOIN_THRESHOLD) {
        joinedParticipantsNames = [];

        return;
    }

    const joinedParticipantsCount = joinedParticipantsNames.length;

    let notificationProps;

    if (joinedParticipantsCount >= 3) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0]
            },
            titleKey: 'notify.connectedThreePlusMembers'
        };
    } else if (joinedParticipantsCount === 2) {
        notificationProps = {
            titleArguments: {
                first: joinedParticipantsNames[0],
                second: joinedParticipantsNames[1]
            },
            titleKey: 'notify.connectedTwoMembers'
        };
    } else if (joinedParticipantsCount) {
        notificationProps = {
            titleArguments: {
                name: joinedParticipantsNames[0]
            },
            titleKey: 'notify.connectedOneMember'
        };
    }

    if (notificationProps) {
        dispatch(
            showNotification(notificationProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }

    joinedParticipantsNames = [];

}, 2000, { leading: false });

/**
 * An array of names of participants that have left the conference. The array
 * is replaced with an empty array as notifications are displayed.
 *
 * @private
 * @type {string[]}
 */
let leftParticipantsNames = [];

/**
 * A throttled internal function that takes the internal list of participant
 * names, {@code leftParticipantsNames}, and triggers the display of a
 * notification informing of their leaving.
 *
 * @private
 * @type {Function}
 */
const _throttledNotifyParticipantLeft = throttle((dispatch: Dispatch<any>, getState: Function) => {
    const participantCount = getParticipantCount(getState());

    // Skip left notifications altogether for large meetings.
    if (participantCount > SILENT_LEFT_THRESHOLD) {
        leftParticipantsNames = [];

        return;
    }

    const leftParticipantsCount = leftParticipantsNames.length;

    let notificationProps;

    if (leftParticipantsCount >= 3) {
        notificationProps = {
            titleArguments: {
                name: leftParticipantsNames[0]
            },
            titleKey: 'notify.leftThreePlusMembers'
        };
    } else if (leftParticipantsCount === 2) {
        notificationProps = {
            titleArguments: {
                first: leftParticipantsNames[0],
                second: leftParticipantsNames[1]
            },
            titleKey: 'notify.leftTwoMembers'
        };
    } else if (leftParticipantsCount) {
        notificationProps = {
            titleArguments: {
                name: leftParticipantsNames[0]
            },
            titleKey: 'notify.leftOneMember'
        };
    }

    if (notificationProps) {
        dispatch(
            showNotification(notificationProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }

    leftParticipantsNames = [];

}, 2000, { leading: false });

/**
 * Queues the display of a notification of a participant having connected to
 * the meeting. The notifications are batched so that quick consecutive
 * connection events are shown in one notification.
 *
 * @param {string} displayName - The name of the participant that connected.
 * @returns {Function}
 */
export function showParticipantJoinedNotification(displayName: string) {
    joinedParticipantsNames.push(displayName);

    return (dispatch: Dispatch<any>, getState: Function) => _throttledNotifyParticipantConnected(dispatch, getState);
}

/**
 * Queues the display of a notification of a participant having left to
 * the meeting. The notifications are batched so that quick consecutive
 * connection events are shown in one notification.
 *
 * @param {string} displayName - The name of the participant that left.
 * @returns {Function}
 */
export function showParticipantLeftNotification(displayName: string) {
    leftParticipantsNames.push(displayName);

    return (dispatch: Dispatch<any>, getState: Function) => _throttledNotifyParticipantLeft(dispatch, getState);
}
