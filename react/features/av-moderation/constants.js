// @flow

import { MEDIA_TYPE, type MediaType } from '../base/media/constants';

/**
 * Mapping between a media type and the witelist reducer key.
 */
export const MEDIA_TYPE_TO_WHITELIST_STORE_KEY: {[key: MediaType]: string} = {
    [MEDIA_TYPE.AUDIO]: 'audioWhitelist',
    [MEDIA_TYPE.VIDEO]: 'videoWhitelist'
};

/**
 * Mapping between a media type and the pending reducer key.
 */
export const MEDIA_TYPE_TO_PENDING_STORE_KEY: {[key: MediaType]: string} = {
    [MEDIA_TYPE.AUDIO]: 'pendingAudio',
    [MEDIA_TYPE.VIDEO]: 'pendingVideo'
};

export const ASKED_TO_UNMUTE_SOUND_ID = 'ASKED_TO_UNMUTE_SOUND';

export const AUDIO_MODERATION_NOTIFICATION_ID = 'audio-moderation';
export const VIDEO_MODERATION_NOTIFICATION_ID = 'video-moderation';
export const CS_MODERATION_NOTIFICATION_ID = 'screensharing-moderation';

export const MODERATION_NOTIFICATIONS = {
    [MEDIA_TYPE.AUDIO]: AUDIO_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.SCREENSHARE]: CS_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.VIDEO]: VIDEO_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.PRESENTER]: CS_MODERATION_NOTIFICATION_ID
};
