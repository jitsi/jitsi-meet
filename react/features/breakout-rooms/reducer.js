import { ReducerRegistry } from '../base/redux';

import {
    BREAKOUT_ROOMS_UPDATED,
    BREAKOUT_ROOM_ADDED,
    BREAKOUT_ROOM_REMOVED
} from './actionTypes';
import { REDUCER_KEY } from './constants';

/**
 * Default State for 'features/transcription' feature
 */
const defaultState = {
    breakoutRooms: []
};

/**
 * Listen for actions for the breakout rooms feature to be used by the actions
 * to update the breakout room list.
 */
ReducerRegistry.register(REDUCER_KEY, (
        state = defaultState, action) => {
    switch (action.type) {
    case BREAKOUT_ROOMS_UPDATED: {
        return {
            ...state,
            breakoutRooms: action.breakoutRooms
        };
    }
    case BREAKOUT_ROOM_ADDED: {
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
    case BREAKOUT_ROOM_REMOVED: {
        const breakoutRooms = state.breakoutRooms.filter(room => room.id !== action.breakoutRoomId);

        return {
            ...state,
            breakoutRooms
        };
    }
    }

    return state;
});
