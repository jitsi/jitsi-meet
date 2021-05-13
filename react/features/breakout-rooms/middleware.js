// @flow

import { DATA_CHANNEL_OPENED, setRoom, setSubject } from '../base/conference';
import { connect, disconnect } from '../base/connection';
import {
    getParticipantCount,
    isLocalParticipantModerator,
    isParticipantModerator,
    getParticipantById,
    PARTICIPANT_JOINED
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { createDesiredLocalTracks } from '../base/tracks';
import { clearNotifications } from '../notifications';
import { ENDPOINT_MESSAGE_RECEIVED } from '../subtitles';

import {
    MOVE_TO_ROOM,
    SEND_PARTICIPANT_TO_ROOM,
    UPDATE_BREAKOUT_ROOMS
} from './actionTypes';
import {
    JSON_TYPE_BREAKOUT_ROOMS,
    JSON_TYPE_BREAKOUT_ROOMS_REQUEST,
    JSON_TYPE_MOVE_TO_ROOM_REQUEST
} from './constants';
import { getMainRoomId, selectBreakoutRooms, selectBreakoutRoomsFakeModeratorId } from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Middleware that catches updates of the breakout rooms list
 * and sends them to the other participants.
 */
StateListenerRegistry.register(
    /* selector */ selectBreakoutRooms,
    /* listener */ (_, store) => _sendBreakoutRooms(store)
);

/**
 * Middleware that catches actions related to breakout rooms
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
        _sendBreakoutRoomsRequest(store);
        break;
    case SEND_PARTICIPANT_TO_ROOM:
        _sendParticipantToRoom(store, action);
        break;
    case MOVE_TO_ROOM:
        _moveToRoom(store, action.roomId);
        break;
    case PARTICIPANT_JOINED:
        _grantOwnerToFakeModerator(store, action);
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
    const { dispatch, getState } = store;
    const state = getState();
    const { json, participant } = action;
    const sender = getParticipantById(state, participant._id);

    if (json) {
        switch (json.type) {
        case JSON_TYPE_BREAKOUT_ROOMS:
            if (isParticipantModerator(sender)) {
                const { breakoutRooms, fakeModeratorId } = json;

                dispatch({
                    type: UPDATE_BREAKOUT_ROOMS,
                    breakoutRooms,
                    fakeModeratorId
                });
            }
            break;
        case JSON_TYPE_BREAKOUT_ROOMS_REQUEST:
            if (isLocalParticipantModerator(state)) {
                _sendBreakoutRooms(store);
            }
            break;
        case JSON_TYPE_MOVE_TO_ROOM_REQUEST:
            if (isParticipantModerator(sender)) {
                _moveToRoom(store, action.json.roomId);
            }
            break;
        }
    }
}

/**
 * Move to a room.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {string} roomId - The room id to move to. If omitted the move will be to the main room.
 * @returns {void}
 */
function _moveToRoom(store, roomId) {
    const { getState, dispatch } = store;
    const state = getState();
    const mainRoomId = getMainRoomId(state);
    const _roomId = roomId || mainRoomId;
    const { subject } = state['features/base/config'];
    const _subject = subject || mainRoomId;

    if (navigator.product === 'ReactNative') {
        dispatch(disconnect());
        dispatch(clearNotifications());
        dispatch(setRoom(_roomId));
        dispatch(setSubject(_subject));
        dispatch(createDesiredLocalTracks());
        dispatch(connect());
    } else {
        APP.conference.leaveRoomAndDisconnect()
        .then(() => {
            dispatch(setRoom(_roomId));
            dispatch(setSubject(_subject));
        });

        APP.conference.roomName = _roomId;
        APP.conference.createInitialLocalTracksAndConnect(_roomId)
        .then(([ tracks, con ]) => APP.conference.startConference(con, tracks));
    }
}

/**
 * Grants owner permission to the breakout rooms fake moderator.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @returns {void}
 */
function _grantOwnerToFakeModerator(store, action) {
    const state = store.getState();
    const { conference } = state['features/base/conference'];
    const fakeModeratorId = selectBreakoutRoomsFakeModeratorId(state);
    const { participant } = action;

    if (fakeModeratorId && fakeModeratorId === participant?.id) {
        conference.grantOwner(fakeModeratorId);
    }
}

/**
 * Sends a request for a list of breakout rooms.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @returns {void}
 */
function _sendBreakoutRoomsRequest(store) {
    const state = store.getState();

    if (getParticipantCount(state) > 1) {
        try {
            const message = {
                type: JSON_TYPE_BREAKOUT_ROOMS_REQUEST
            };

            APP.conference.sendEndpointMessage('', message);
        } catch (e) {
            logger.error(e);
        }
    }
}

/**
 * Sends the current list of breakout rooms to the other participants.
 *
 * @param {Store} store - The redux store.
 * @returns {void}
 */
function _sendBreakoutRooms(store) {
    const state = store.getState();
    const breakoutRooms = selectBreakoutRooms(state);
    const fakeModeratorId = selectBreakoutRoomsFakeModeratorId(state);

    if (isLocalParticipantModerator(state) && getParticipantCount(state) > 1) {
        try {
            const message = {
                type: JSON_TYPE_BREAKOUT_ROOMS,
                breakoutRooms,
                fakeModeratorId
            };

            APP.conference.sendEndpointMessage('', message);
        } catch (e) {
            logger.error(e);
        }
    }
}

/**
 * Sends a request to a user to move to a room.
 *
 * @param {Object} state - The Redux state of the breakout-rooms feature.
 * @param {Action} action - The Redux action {@code SEND_PARTICIPANT_TO_ROOM}.
 * @returns {void}
 */
function _sendParticipantToRoom(state, action) {
    const { participantId, roomId } = action;

    try {
        const message = {
            type: JSON_TYPE_MOVE_TO_ROOM_REQUEST,
            roomId
        };

        APP.conference.sendEndpointMessage(participantId, message);
    } catch (e) {
        logger.error(e);
    }
}
