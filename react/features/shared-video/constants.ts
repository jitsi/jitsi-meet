/**
 * Fixed name of the video player fake participant.
 *
 * @type {string}
 */
export const VIDEO_PLAYER_PARTICIPANT_NAME = 'Video';

/**
 * Fixed name of the youtube player fake participant.
 *
 * @type {string}
 */
export const YOUTUBE_PLAYER_PARTICIPANT_NAME = 'YouTube';


/**
 * Shared video command.
 *
 * @type {string}
 */
export const SHARED_VIDEO = 'shared-video';

/**
 * Available playback statuses.
 */
export const PLAYBACK_STATUSES = {
    PLAYING: 'playing',
    PAUSED: 'pause',
    STOPPED: 'stop'
};

/**
 * Playback start state.
 */
export const PLAYBACK_START = 'start';

/**
 * The domain for youtube URLs.
 */
export const YOUTUBE_URL_DOMAIN = 'youtube.com';

/**
 * The constant to allow URL domains.
 */
export const ALLOW_ALL_URL_DOMAINS = '*';

/**
 * The default white listed domains for shared video.
 */
export const DEFAULT_ALLOWED_URL_DOMAINS = [ YOUTUBE_URL_DOMAIN ];
