import ReducerRegistry from '../base/redux/ReducerRegistry';

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

export interface IBreakoutRoomsState {
    roomCounter: number;
    rooms: {
        [id: string]: {
            id: string;
            isMainRoom?: boolean;
            jid: string;
            name: string;
            participants: {
                [jid: string]: {
                    displayName: string;
                    jid: string;
                    role: string;
                }
            }
        }
    };
}

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register(FEATURE_KEY, (state: IBreakoutRoomsState = DEFAULT_STATE, action: any) => {
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
