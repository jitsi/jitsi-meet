// @flow

import conference from '../../../conference';
import { DATA_CHANNEL_OPENED } from '../base/conference';
import {
    getParticipantCount,
    isLocalParticipantModerator,
    isParticipantModerator,
    getParticipantById
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { ENDPOINT_MESSAGE_RECEIVED } from '../subtitles';

import {
    BREAKOUT_ROOM_ADDED,
    BREAKOUT_ROOM_REMOVED,
    PARTICIPANT_SENT_TO_BREAKOUT_ROOM
} from './actionTypes';
import { updateBreakoutRooms } from './actions';
import {
    REDUCER_KEY,
    JSON_TYPE_BREAKOUT_ROOMS_LIST,
    JSON_TYPE_BREAKOUT_ROOMS_REQUEST,
    JSON_TYPE_MOVE_TO_BREAKOUT_ROOM_REQUEST
} from './constants';
import logger from './logger';

/**
 * Middleware that catches actions related to breakout rooms
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(store, next, action);
    case BREAKOUT_ROOM_ADDED:
        conference.initBreakoutRoom(action.breakoutRoomId);

        // falls through
    case BREAKOUT_ROOM_REMOVED:
        return sendBreakoutRooms(store, next, action);
    case DATA_CHANNEL_OPENED:
        return sendBreakoutRoomsRequest(store, next, action);
    case PARTICIPANT_SENT_TO_BREAKOUT_ROOM:
        return sendBreakoutRoomsMoveParticipantRequest(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature breakout rooms that the action
 * {@code ENDPOINT_MESSAGE_RECEIVED} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _endpointMessageReceived(store, next, action) {
    const { dispatch, getState } = store;
    const state = getState();
    const { json, participant } = action;
    const sender = getParticipantById(state, participant._id);

    try {
        if (json) {
            switch (json.type) {
            case JSON_TYPE_BREAKOUT_ROOMS_LIST:
                if (isParticipantModerator(sender)) {
                    const breakoutRooms = json.breakoutRooms;

                    dispatch(updateBreakoutRooms(breakoutRooms));
                }
                break;
            case JSON_TYPE_BREAKOUT_ROOMS_REQUEST:
                if (isLocalParticipantModerator(state)) {
                    sendBreakoutRooms(store, next, action);
                }
                break;
            case JSON_TYPE_MOVE_TO_BREAKOUT_ROOM_REQUEST:
                if (isParticipantModerator(sender)) {
                    const breakoutRoom = json.breakoutRoom;

                    conference.switchRoom(breakoutRoom.id);
                }
                break;
            }
        }
    } catch (error) {
        logger.error('Error occurred while updating breakout rooms\n', error);
    }

    return next(action);
}

/**
 * Sends the current list of breakout rooms to the other participants.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function sendBreakoutRooms(store, next, action) {
    const result = next(action);
    const state = store.getState();
    const { breakoutRooms } = state[REDUCER_KEY];

    if (isLocalParticipantModerator(state) && getParticipantCount(state) > 1) {
        try {
            const message = {
                type: JSON_TYPE_BREAKOUT_ROOMS_LIST,
                breakoutRooms
            };

            conference.sendEndpointMessage('', message);
        } catch (e) {
            logger.error(e);
        }
    }

    return result;
}

/**
 * Sends a request for a list of breakout rooms.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function sendBreakoutRoomsRequest(store, next, action) {
    const state = store.getState();

    if (getParticipantCount(state) > 1) {
        try {
            const message = {
                type: JSON_TYPE_BREAKOUT_ROOMS_REQUEST
            };

            conference.sendEndpointMessage('', message);
        } catch (e) {
            logger.error(e);
        }
    }

    return next(action);
}

/**
 * Sends a request to a user for them to join a breakout room.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function sendBreakoutRoomsMoveParticipantRequest(store, next, action) {
    const { participantId, breakoutRoom } = action;

    try {
        const message = {
            type: JSON_TYPE_MOVE_TO_BREAKOUT_ROOM_REQUEST,
            breakoutRoom
        };

        conference.sendEndpointMessage(participantId, message);
    } catch (e) {
        logger.error(e);
    }

    return next(action);
}
