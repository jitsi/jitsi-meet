// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_ROOM,
    ADD_PROXY_MODERATOR_CONFERENCE,
    NOTIFY_ROOM_REMOVAL,
    REMOVE_PROXY_MODERATOR_CONFERENCE,
    REMOVE_ROOM,
    SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL,
    SET_NEXT_ROOM_INDEX,
    UPDATE_PARTICIPANTS
} from './actionTypes';
import { FEATURE_KEY } from './constants';

/**
 * Default state for the breakout-rooms feature.
 */
const defaultState = {
    rooms: {},
    removedRooms: []
};

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register(FEATURE_KEY, (state = defaultState, action) => {
    switch (action.type) {
    case ADD_ROOM: {
        return {
            ...state,
            rooms: {
                ...state.rooms,
                [action.room.id]: action.room
            }
        };
    }
    case REMOVE_ROOM: {
        const { roomId } = action;
        const { removedRooms = [] } = state;
        // eslint-disable-next-line no-unused-vars
        const { [roomId]: _, ...rooms } = state.rooms || {};

        return {
            ...state,
            rooms,
            removedRooms: removedRooms.filter(id => id !== roomId)
        };
    }
    case NOTIFY_ROOM_REMOVAL: {
        return {
            ...state,
            removedRooms: [ ...state.removedRooms, action.roomId ]
        };
    }
    case ADD_PROXY_MODERATOR_CONFERENCE: {
        return {
            ...state,
            proxyModeratorConferences: {
                ...state.proxyModeratorConferences || {},
                [action.roomId]: action.proxyModeratorConference
            }
        };
    }
    case REMOVE_PROXY_MODERATOR_CONFERENCE: {
        const { roomId, proxyModeratorId } = action;
        const { rooms } = state;
        const { [roomId]: { proxyModerators } } = rooms;
        // eslint-disable-next-line no-unused-vars
        const { [roomId]: _, ...proxyModeratorConferences } = state.proxyModeratorConferences || {};

        return {
            ...state,
            rooms: {
                ...rooms,
                [roomId]: {
                    ...rooms[roomId],
                    proxyModerators: proxyModerators.filter(id => id !== proxyModeratorId)
                }
            },
            proxyModeratorConferences
        };
    }
    case UPDATE_PARTICIPANTS: {
        const { roomId, participants } = action;
        const { rooms } = state;

        return {
            ...state,
            rooms: {
                ...rooms,
                [roomId]: {
                    ...rooms[roomId],
                    participants
                }
            }
        };
    }
    case SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL: {
        return {
            ...state,
            isScheduledSendRoomsToAll: action.isScheduledSendRoomsToAll
        };
    }
    case SET_NEXT_ROOM_INDEX: {
        return {
            ...state,
            nextRoomIndex: action.nextRoomIndex
        };
    }
    }

    return state;
});
