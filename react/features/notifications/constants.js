// @flow

import {
    AUDIO_MODERATION_NOTIFICATION_ID,
    CS_MODERATION_NOTIFICATION_ID,
    VIDEO_MODERATION_NOTIFICATION_ID
} from '../av-moderation/constants';
import { MEDIA_TYPE } from '../base/media';

/**
 * The standard time when auto-disappearing notifications should disappear.
 */
export const NOTIFICATION_TIMEOUT = 2500;

/**
 * The set of possible notification types.
 *
 * @enum {string}
 */
export const NOTIFICATION_TYPE = {
    ERROR: 'error',
    INFO: 'info',
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
    [NOTIFICATION_TYPE.INFO]: 3,
    [NOTIFICATION_TYPE.NORMAL]: 3,
    [NOTIFICATION_TYPE.SUCCESS]: 3,
    [NOTIFICATION_TYPE.WARNING]: 4
};

/**
 * Amount of participants beyond which no join notification will be emitted.
 */
export const SILENT_JOIN_THRESHOLD = 30;

export const MODERATION_NOTIFICATIONS = {
    [MEDIA_TYPE.AUDIO]: AUDIO_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.VIDEO]: VIDEO_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.PRESENTER]: CS_MODERATION_NOTIFICATION_ID
};
