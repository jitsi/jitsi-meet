import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    UPDATE_BREAKOUT_ROOMS,
    _RESET_BREAKOUT_ROOMS,
    _UPDATE_ROOM_COUNTER
} from './actionTypes';
import { FEATURE_KEY } from './constants';
import { IRooms } from './types';

const DEFAULT_STATE = {
    rooms: {},
    roomCounter: 0,
    userContextCache: {}
};

export interface IBreakoutRoomsState {

    /**
     * Whether the main room lets only moderators, and the participants they move, join breakout rooms.
     */
    joinRestricted?: boolean;
    roomCounter: number;
    rooms: IRooms;
    userContextCache: {
        [participantId: string]: {
            [key: string]: any;
            id?: string;
            name?: string;
        };
    };
}

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register<IBreakoutRoomsState>(FEATURE_KEY, (state = DEFAULT_STATE, action): IBreakoutRoomsState => {
    switch (action.type) {
    case _UPDATE_ROOM_COUNTER:
        return {
            ...state,
            roomCounter: action.roomCounter
        };
    case UPDATE_BREAKOUT_ROOMS: {
        const { joinRestricted, roomCounter, rooms, userContextCache } = action;

        return {
            ...state,

            // An update that the client sends to itself, e.g. for a changed display name, does not carry it.
            joinRestricted: joinRestricted ?? state.joinRestricted,
            roomCounter,
            rooms,
            userContextCache: userContextCache || state.userContextCache
        };
    }
    case _RESET_BREAKOUT_ROOMS: {
        return DEFAULT_STATE;
    }
    }

    return state;
});
