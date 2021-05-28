// @flow

/**
 * The type of (redux) action to add a conference for the proxy moderator
 *
 */
export const ADD_PROXY_MODERATOR_CONFERENCE = 'ADD_PROXY_MODERATOR_CONFERENCE';

/**
 * The type of (redux) action to add a room
 *
 */
export const ADD_ROOM = 'ADD_ROOM';

/**
 * The type of (redux) action to notify other participants of the removal of a room.
 *
 */
export const NOTIFY_ROOM_REMOVAL = 'NOTIFY_ROOM_REMOVAL';

/**
  * The type of (redux) action to remove a conference for the proxy moderator
  *
  */
export const REMOVE_PROXY_MODERATOR_CONFERENCE = 'REMOVE_PROXY_MODERATOR_CONFERENCE';

/**
 * The type of (redux) action to remove a room
 *
 */
export const REMOVE_ROOM = 'REMOVE_ROOM';

/**
  * The type of (redux) action to flag whether sending of the rooms to all participants is scheduled.
  *
  */
export const SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL = 'SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL';

/**
  * The type of (redux) action to set a shared key for auto-admission when returning to the main room.
  *
  */
export const SET_KNOCKING_SHARED_KEY = 'SET_KNOCKING_SHARED_KEY';

/**
  * The type of (redux) action to set the next room index.
  *
  */
export const SET_NEXT_ROOM_INDEX = 'SET_NEXT_ROOM_INDEX';

/**
  * The type of (redux) action to update the list of participants in a room.
  *
  */
export const UPDATE_PARTICIPANTS = 'UPDATE_PARTICIPANTS';
