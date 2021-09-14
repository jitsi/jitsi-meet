// @flow

import { NON_PARTICIPANT_MESSAGE_RECEIVED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { moveToRoom } from './actions';
import {
    JSON_TYPE_MOVE_TO_ROOM_REQUEST,
    JSON_TYPE_UPDATE_BREAKOUT_ROOMS
} from './constants';


/**
 * Middleware that catches actions related to the breakout-rooms feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case NON_PARTICIPANT_MESSAGE_RECEIVED:
        _handleEndpointMessage(store, action);
        break;
    }

    return next(action);
});

/**
 * Handles {@code NON_PARTICIPANT_MESSAGE_RECEIVED} actions for the breakout-rooms feature.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Action} action - The redux action {@code NON_PARTICIPANT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @returns {void}
 */
function _handleEndpointMessage(store, action) {
    const { json } = action;

    if (json) {
        switch (json.type) {
        case JSON_TYPE_UPDATE_BREAKOUT_ROOMS: {
            const { nextIndex, rooms } = json;

            store.dispatch({
                type: UPDATE_BREAKOUT_ROOMS,
                nextIndex: parseInt(nextIndex, 10) || 1,
                rooms
            });
            break;
        }
        case JSON_TYPE_MOVE_TO_ROOM_REQUEST:
            store.dispatch(moveToRoom(json.roomId));
            break;
        }
    }
}
