export type MediaType = 'audio' | 'video' | 'desktop';

/**
 * The set of media types for AV moderation.
 *
 * @enum {string}
 */
export const MEDIA_TYPE: {
    AUDIO: MediaType;
    DESKTOP: MediaType;
    VIDEO: MediaType;
} = {
    AUDIO: 'audio',
    DESKTOP: 'desktop',
    VIDEO: 'video'
};

/**
 * Mapping between a media type and the whitelist reducer key.
 */
export const MEDIA_TYPE_TO_WHITELIST_STORE_KEY: { [key: string]: string; } = {
    [MEDIA_TYPE.AUDIO]: 'audioWhitelist',
    [MEDIA_TYPE.DESKTOP]: 'desktopWhitelist',
    [MEDIA_TYPE.VIDEO]: 'videoWhitelist'
};

/**
 * Mapping between a media type and the pending reducer key.
 */
export const MEDIA_TYPE_TO_PENDING_STORE_KEY: { [key: string]: 'pendingAudio' | 'pendingDesktop' | 'pendingVideo'; } = {
    [MEDIA_TYPE.AUDIO]: 'pendingAudio',
    [MEDIA_TYPE.DESKTOP]: 'pendingDesktop',
    [MEDIA_TYPE.VIDEO]: 'pendingVideo'
};

export const ASKED_TO_UNMUTE_NOTIFICATION_ID = 'asked-to-unmute';
export const ASKED_TO_UNMUTE_SOUND_ID = 'ASKED_TO_UNMUTE_SOUND';

export const AUDIO_MODERATION_NOTIFICATION_ID = 'audio-moderation';
export const DESKTOP_MODERATION_NOTIFICATION_ID = 'desktop-moderation';
export const VIDEO_MODERATION_NOTIFICATION_ID = 'video-moderation';

export const AUDIO_RAISED_HAND_NOTIFICATION_ID = 'raise-hand-audio';
export const DESKTOP_RAISED_HAND_NOTIFICATION_ID = 'raise-hand-desktop';
export const VIDEO_RAISED_HAND_NOTIFICATION_ID = 'raise-hand-video';

export const MODERATION_NOTIFICATIONS = {
    [MEDIA_TYPE.AUDIO]: AUDIO_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.DESKTOP]: DESKTOP_MODERATION_NOTIFICATION_ID,
    [MEDIA_TYPE.VIDEO]: VIDEO_MODERATION_NOTIFICATION_ID
};
