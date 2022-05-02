/**
 * Hide these emails when trying to join a lobby.
 */
export const HIDDEN_EMAILS = [ 'inbound-sip-jibri@jitsi.net', 'outbound-sip-jibri@jitsi.net' ];

/**
 * The identifier of the sound to be played when a participant joins lobby.
 *
 * @type {string}
 */
export const KNOCKING_PARTICIPANT_SOUND_ID = 'KNOCKING_PARTICIPANT_SOUND';

/**
 * Lobby chat initialized message type.
 *
 * @type {string}
 */
export const LOBBY_CHAT_INITIALIZED = 'LOBBY_CHAT_INITIALIZED';

/**
   * Event message sent to knocking participant when moderator in chat with leaves.
   *
   * @type {string}
   */
export const MODERATOR_IN_CHAT_WITH_LEFT = 'MODERATOR_IN_CHAT_WITH_LEFT';
