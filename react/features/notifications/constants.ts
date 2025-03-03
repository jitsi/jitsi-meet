/**
 * The standard time when auto-disappearing notifications should disappear.
 */
export const NOTIFICATION_TIMEOUT = {
    SHORT: 2500,
    MEDIUM: 5000,
    LONG: 10000,
    EXTRA_LONG: 60000,
    STICKY: false
};

/**
 * Notification timeout type.
 */
export enum NOTIFICATION_TIMEOUT_TYPE {
    EXTRA_LONG = 'extra_long',
    LONG = 'long',
    MEDIUM = 'medium',
    SHORT = 'short',
    STICKY = 'sticky'
}

/**
 * The set of possible notification types.
 *
 * @enum {string}
 */
export const NOTIFICATION_TYPE = {
    ERROR: 'error',
    NORMAL: 'normal',
    SUCCESS: 'success',
    WARNING: 'warning'
};

/**
 * A mapping of notification type to priority of display.
 *
 * @enum {number}
 */
export const NOTIFICATION_TYPE_PRIORITIES = {
    [NOTIFICATION_TYPE.ERROR]: 5,
    [NOTIFICATION_TYPE.NORMAL]: 3,
    [NOTIFICATION_TYPE.SUCCESS]: 3,
    [NOTIFICATION_TYPE.WARNING]: 4
};

/**
 * The set of possible notification icons.
 *
 * @enum {string}
 */
export const NOTIFICATION_ICON = {
    ...NOTIFICATION_TYPE,
    MESSAGE: 'message',
    PARTICIPANT: 'participant',
    PARTICIPANTS: 'participants'
};

/**
 * The identifier of the calendar notification.
 *
 * @type {string}
 */
export const CALENDAR_NOTIFICATION_ID = 'CALENDAR_NOTIFICATION_ID';

/**
 * The identifier of the disable self view notification.
 *
 * @type {string}
 */
export const DATA_CHANNEL_CLOSED_NOTIFICATION_ID = 'DATA_CHANNEL_CLOSED_NOTIFICATION_ID';

/**
 * The identifier of the disable self view notification.
 *
 * @type {string}
 */
export const DISABLE_SELF_VIEW_NOTIFICATION_ID = 'DISABLE_SELF_VIEW_NOTIFICATION_ID';

/**
 * The identifier of the lobby notification.
 *
 * @type {string}
 */
export const LOBBY_NOTIFICATION_ID = 'LOBBY_NOTIFICATION';

/**
 * The identifier of the local recording notification.
 *
 * @type {string}
 */
export const LOCAL_RECORDING_NOTIFICATION_ID = 'LOCAL_RECORDING_NOTIFICATION_ID';

/**
 * The identifier of the raise hand notification.
 *
 * @type {string}
 */
export const RAISE_HAND_NOTIFICATION_ID = 'RAISE_HAND_NOTIFICATION';

/**
 * The identifier of the salesforce link notification.
 *
 * @type {string}
 */
export const SALESFORCE_LINK_NOTIFICATION_ID = 'SALESFORCE_LINK_NOTIFICATION';

/**
 * The identifier of the visitors promotion notification.
 *
 * @type {string}
 */
export const VISITORS_PROMOTION_NOTIFICATION_ID = 'VISITORS_PROMOTION_NOTIFICATION';

/**
 * The identifier of the visitors notification indicating the meeting is not live.
 *
 * @type {string}
 */
export const VISITORS_NOT_LIVE_NOTIFICATION_ID = 'VISITORS_NOT_LIVE_NOTIFICATION_ID';

/**
 * Amount of participants beyond which no join notification will be emitted.
 */
export const SILENT_JOIN_THRESHOLD = 30;

/**
 * Amount of participants beyond which no left notification will be emitted.
 */
export const SILENT_LEFT_THRESHOLD = 30;
