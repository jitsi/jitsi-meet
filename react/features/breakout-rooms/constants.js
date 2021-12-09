// @flow

/**
 * Key for this feature.
 */
export const FEATURE_KEY = 'features/breakout-rooms';

/**
  * The type of json-message which indicates that json carries
  * a request for a participant to move to a specified room.
  */
export const JSON_TYPE_MOVE_TO_ROOM_REQUEST = `${FEATURE_KEY}/move-to-room`;

/**
  * The type of json-message which indicates that json carries a request to remove a specified breakout room.
  */
export const JSON_TYPE_REMOVE_BREAKOUT_ROOM = `${FEATURE_KEY}/remove`;

/**
  * The type of json-message which indicates that json carries breakout rooms data.
  */
export const JSON_TYPE_UPDATE_BREAKOUT_ROOMS = `${FEATURE_KEY}/update`;
