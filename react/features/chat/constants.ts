/**
 * Maximum number of characters allowed.
 */
export const CHAR_LIMIT = 500;

/**
 * The initial size of the chat.
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
 * Drag handle dimensions for resizable chat.
 */
export const CHAT_DRAG_HANDLE_WIDTH = 9;
export const CHAT_DRAG_HANDLE_HEIGHT = 100;

/**
 * Touch target size for chat drag handle on touch devices.
 * Provides adequate hit area (44px) for comfortable tapping.
 */
export const CHAT_TOUCH_HANDLE_SIZE = 44;

/**
 * Offset from edge for positioning the chat drag handle.
 */
export const CHAT_DRAG_HANDLE_OFFSET = 4;


/**
 * Lobby message type.
 */
export const LOBBY_CHAT_MESSAGE = 'LOBBY_CHAT_MESSAGE';

export enum ChatTabs {
    CHAT = 'chat-tab',
    CLOSED_CAPTIONS = 'cc-tab',
    FILE_SHARING = 'file_sharing-tab',
    POLLS = 'polls-tab'
}

/**
 * Formatter string to display the message timestamp.
 */
export const TIMESTAMP_FORMAT = 'H:mm';

/**
 * The namespace for system messages.
 */
export const MESSAGE_TYPE_SYSTEM = 'system_chat_message';

export const OPTION_GROUPCHAT = 'groupchat';
