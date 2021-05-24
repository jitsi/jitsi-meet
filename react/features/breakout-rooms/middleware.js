// @flow

import { DATA_CHANNEL_OPENED } from '../base/conference';
import {
    getParticipantById,
    isParticipantModerator,
    PARTICIPANT_JOINED
} from '../base/participants';
import { equals, MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { ENDPOINT_MESSAGE_RECEIVED } from '../subtitles';

import {
    grantOwnerToLocalProxyModerator,
    moveToRoom,
    sendRoomsRequest,
    sendRoomsToAll,
    updateRooms
} from './actions';
import {
    JSON_TYPE_ROOMS,
    JSON_TYPE_MOVE_TO_ROOM_REQUEST
} from './constants';
import {
    getBreakoutRooms,
    isInBreakoutRoom
} from './functions';

/**
 * Middleware that catches updates of the rooms list and sends them to the other participants.
 */
StateListenerRegistry.register(
    /* selector */ getBreakoutRooms,
    /* listener */ (state, store, previousState) => {

        if (!equals(state?.rooms, previousState?.rooms)
            || !equals(state?.roomsRemoval, previousState?.roomsRemoval)) {
            store.dispatch(sendRoomsToAll());
        }
    }
);

/**
 * Middleware that catches actions related to the current room of the participant
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        _handleEndpointMessage(store, action);
        break;
    case DATA_CHANNEL_OPENED:
        if (!isInBreakoutRoom(store)) {
            store.dispatch(sendRoomsRequest());
        }
        break;
    case PARTICIPANT_JOINED:
        store.dispatch(grantOwnerToLocalProxyModerator(action.participant));
        break;
    }

    return next(action);
});

/**
 * Notifies the feature breakout rooms that the action {@code ENDPOINT_MESSAGE_RECEIVED}
 * is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @returns {void}
 */
function _handleEndpointMessage(store, action) {
    const { json, participant } = action;
    const sender = getParticipantById(store, participant?._id);

    if (json) {
        switch (json.type) {
        case JSON_TYPE_ROOMS:
            if (isParticipantModerator(sender)) {
                store.dispatch(updateRooms(json));
            }
            break;
        case JSON_TYPE_MOVE_TO_ROOM_REQUEST:
            if (isParticipantModerator(sender)) {
                store.dispatch(moveToRoom(json.roomId));
            }
            break;
        }
    }
}
