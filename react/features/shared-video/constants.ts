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
 * Command for requesting shared video state from the video owner.
 *
 * @type {string}
 */
export const REQUEST_SHARED_VIDEO_STATE_COMMAND = 'request-shared-video-state';
