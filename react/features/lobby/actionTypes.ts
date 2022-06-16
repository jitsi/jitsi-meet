// @flow

/**
 * Action type to signal the arriving or updating of a knocking participant.
 */
export const KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED = 'KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED';

/**
 * Action type to signal the leave of a knocking participant.
 */
export const KNOCKING_PARTICIPANT_LEFT = 'KNOCKING_PARTICIPANT_LEFT';

/**
 * Action type to set the new state of the lobby mode.
 */
export const SET_LOBBY_MODE_ENABLED = 'SET_LOBBY_MODE_ENABLED';

/**
 * Action type to set the knocking state of the participant.
 */
export const SET_KNOCKING_STATE = 'SET_KNOCKING_STATE';

/**
 * Action type to set the lobby visibility.
 */
export const SET_LOBBY_VISIBILITY = 'TOGGLE_LOBBY_VISIBILITY';

/**
 * Action type to set the password join failed status.
 */
export const SET_PASSWORD_JOIN_FAILED = 'SET_PASSWORD_JOIN_FAILED';

/**
 * Action type to set a lobby chat participant's state to chatting
 */
 export const SET_LOBBY_PARTICIPANT_CHAT_STATE = 'SET_LOBBY_PARTICIPANT_CHAT_STATE';

 /**
  * Action type to remove chattingWithModerator field
  */
 export const REMOVE_LOBBY_CHAT_WITH_MODERATOR = 'REMOVE_LOBBY_CHAT_WITH_MODERATOR';