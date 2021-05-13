// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_BREAKOUT_ROOM,
    CREATE_BREAKOUT_ROOM_CONNECTION,
    REMOVE_BREAKOUT_ROOM,
    UPDATE_BREAKOUT_ROOMS
} from './actionTypes';
import { FEATURE_KEY } from './constants';

/**
 * Default state for the breakout-rooms feature.
 */
const defaultState = {
    breakoutRooms: []
};

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register(FEATURE_KEY, (state = defaultState, action) => {
    switch (action.type) {
    case CREATE_BREAKOUT_ROOM_CONNECTION: {
        const { connection, fakeModeratorId } = action;

        return {
            ...state,
            connection,
            fakeModeratorId
        };
    }
    case UPDATE_BREAKOUT_ROOMS: {
        const { breakoutRooms, fakeModeratorId } = action;

        return {
            ...state,
            breakoutRooms,
            fakeModeratorId
        };
    }
    case ADD_BREAKOUT_ROOM: {
        const nextIndex = (state.breakoutRooms[state.breakoutRooms.length - 1]?.index || 0) + 1;
        const breakoutRooms = [
            ...state.breakoutRooms,
            { id: action.breakoutRoomId,
                index: nextIndex }
        ];

        return {
            ...state,
            breakoutRooms
        };
    }
    case REMOVE_BREAKOUT_ROOM: {
        const breakoutRooms = state.breakoutRooms.filter(room => room.id !== action.breakoutRoomId);

        return {
            ...state,
            breakoutRooms
        };
    }
    }

    return state;
});
