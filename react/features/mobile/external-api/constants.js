/**
 * Event which will be emitted on the native side when a chat message is received
 * through the channel.
 */
export const CHAT_MESSAGE_RECEIVED = 'CHAT_MESSAGE_RECEIVED';

/**
  * Event which will be emitted on the native side when the chat dialog is displayed/closed.
  */
export const CHAT_TOGGLED = 'CHAT_TOGGLED';

/**
  * Event which will be emitted on the native side to indicate the conference
  * has ended either by user request or because an error was produced.
  */
export const CONFERENCE_TERMINATED = 'CONFERENCE_TERMINATED';

/**
  * Event which will be emitted on the native side to indicate a message was received
  * through the channel.
  */
export const ENDPOINT_TEXT_MESSAGE_RECEIVED = 'ENDPOINT_TEXT_MESSAGE_RECEIVED';

/**
  * Event which will be emitted on the native side with the participant info array.
  */
export const PARTICIPANTS_INFO_RETRIEVED = 'PARTICIPANTS_INFO_RETRIEVED';

/**
  * Event which will be emitted on the native side to indicate a participant togggles
  * the screen share.
  */
export const SCREEN_SHARE_TOGGLED = 'SCREEN_SHARE_TOGGLED';
