// @flow

/**
 * The size of the chat.
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

/**
 * The modes of the buttons of the chat and polls tabs.
 */
export const BUTTON_MODES = {
    CONTAINED: 'contained',
    TEXT: 'text'
};
