/**
 * Reducer key for the feature.
 */
export const REDUCER_KEY = 'features/breakout-rooms';

/**
 * The type of json-message which indicates that json carries a
 * list of breakout rooms.
 */
export const JSON_TYPE_BREAKOUT_ROOMS_LIST = 'breakout-rooms-list';

/**
 * The type of json-message which indicates that json carries
 * a request for an update of the list of breakout rooms.
 */
export const JSON_TYPE_BREAKOUT_ROOMS_REQUEST = 'breakout-rooms-request';

/**
 * The type of json-message which indicates that json carries
 * a request for a participant to join a breakout room.
 */
export const JSON_TYPE_MOVE_TO_BREAKOUT_ROOM_REQUEST = 'move-to-breakout-room-request';

/**
 * Enum of possible breakout rooms action triggers.
 */
export const ActionTrigger = {
    Hover: 'ActionTrigger.Hover',
    Permanent: 'ActionTrigger.Permanent'
};
