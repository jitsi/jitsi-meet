// @flow

/**
 * Key for this feature.
 */
export const FEATURE_KEY = 'features/breakout-rooms';

/**
 * The type of json-message which indicates that json carries
 * a list of breakout rooms.
 */
export const JSON_TYPE_BREAKOUT_ROOMS = 'breakout-rooms';

/**
 * The type of json-message which indicates that json carries
 * a request for the list of breakout rooms.
 */
export const JSON_TYPE_BREAKOUT_ROOMS_REQUEST = 'breakout-rooms-request';

/**
 * The type of json-message which indicates that json carries
 * a request for a participant to move to a specified room.
 */
export const JSON_TYPE_MOVE_TO_ROOM_REQUEST = 'move-to-room-request';

/**
 * Enum of possible breakout rooms action triggers.
 */
export const ActionTrigger = {
    Hover: 'ActionTrigger.Hover',
    Permanent: 'ActionTrigger.Permanent'
};
