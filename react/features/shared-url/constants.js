// @flow

/**
 * Example shared URL.
 * @type {string}
 */
export const defaultSharedURL = 'https://jitsi.org';

/**
 * Fixed name of the shared URL fake participant.
 * @type {string}
 */
export const SHARED_URL_PARTICIPANT_NAME = 'Shared URL';

/**
 * Shared URL command.
 * @type {string}
 */
export const SHARED_URL = 'shared-url';

/**
 * URL is being shared (active)
 * @type {string}
 */
export const SHARED_URL_STATE_ACTIVE = 'sharing';

/**
 * URL is not being shared (inactive)
 * @type {string}
 */
export const SHARED_URL_STATE_INACTIVE = 'not-sharing';

/**
 * start sharing URL command
 * @type {string}
 */
export const SHARED_URL_COMMAND_START = 'start-url-sharing';

/**
 * stop sharing URL command
 * @type {string}
 */
export const SHARED_URL_COMMAND_STOP = 'stop-url-sharing';