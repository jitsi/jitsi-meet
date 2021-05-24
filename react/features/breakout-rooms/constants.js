// @flow

/**
 * Key for this feature.
 */
export const FEATURE_KEY = 'features/breakout-rooms';

/**
 * The type of json-message which indicates that json carries a list of rooms.
 */
export const JSON_TYPE_ROOMS = `${FEATURE_KEY}/rooms`;

/**
 * The type of json-message which indicates that json carries
 * a request for the list of rooms.
 */
export const JSON_TYPE_ROOMS_REQUEST = `${FEATURE_KEY}/rooms-request`;

/**
 * The type of json-message which indicates that json carries
 * a request for a participant to move to a specified room.
 */
export const JSON_TYPE_MOVE_TO_ROOM_REQUEST = `${FEATURE_KEY}/move-to-room-request`;

/**
 * The interval in milliseconds to wait before sending an updated list of rooms to all participants.
 */
export const SEND_ROOMS_TO_ALL_INTERVAL = 1500;

/**
 * Enum of possible rooms action triggers.
 */
export const ActionTrigger = {
    Hover: 'ActionTrigger.Hover',
    Permanent: 'ActionTrigger.Permanent'
};
