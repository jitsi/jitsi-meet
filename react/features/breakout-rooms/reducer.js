// @flow

import { ReducerRegistry } from '../base/redux';

import {
    _RESET_BREAKOUT_ROOMS,
    _UPDATE_ROOM_COUNTER,
    UPDATE_BREAKOUT_ROOMS
} from './actionTypes';
import { FEATURE_KEY } from './constants';

const DEFAULT_STATE = {
    rooms: {},
    roomCounter: 0
};

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register(FEATURE_KEY, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case _UPDATE_ROOM_COUNTER:
        return {
            ...state,
            roomCounter: action.roomCounter
        };
    case UPDATE_BREAKOUT_ROOMS: {
        const { roomCounter, rooms } = action;

        return {
            ...state,
            roomCounter,
            rooms
        };
    }
    case _RESET_BREAKOUT_ROOMS: {
        return DEFAULT_STATE;
    }
    }

    return state;
});
