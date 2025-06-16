/**
 * Maximum number of characters allowed.
 */
export const CHAR_LIMIT = 500;

/**
 * The size of the chat. Equal to $sidebarWidth SCSS variable.
 */
export const CHAT_SIZE = 315;

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new chat message is received.
 *
 * @type {string}
 */
export const INCOMING_MSG_SOUND_ID = 'INCOMING_MSG_SOUND';

/**
 * The {@code messageType} of error (system) messages.
 */
export const MESSAGE_TYPE_ERROR = 'error';

/**
 * The {@code messageType} of local messages.
 */
export const MESSAGE_TYPE_LOCAL = 'local';

/**
 * The {@code messageType} of remote messages.
 */
export const MESSAGE_TYPE_REMOTE = 'remote';

export const SMALL_WIDTH_THRESHOLD = 580;


/**
 * Lobby message type.
 */
export const LOBBY_CHAT_MESSAGE = 'LOBBY_CHAT_MESSAGE';

export const CHAT_TABS = {
    POLLS: 'polls-tab',
    CHAT: 'chat-tab'
};

/**
 * Formatter string to display the message timestamp.
 */
export const TIMESTAMP_FORMAT = 'H:mm';

/**
 * The namespace for system messages.
 */
export const MESSAGE_TYPE_SYSTEM = 'system_chat_message';
