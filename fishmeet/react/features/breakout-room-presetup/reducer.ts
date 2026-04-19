import ReducerRegistry from '../base/redux/ReducerRegistry';
import logger from '../breakout-rooms/logger';

import {
    _AVAILABLE_TO_SET_BREAKOUT_ROOMS,
    _ENABlE_PRESET_BREAKOUT_ROOMS,
    _PRESET_BREAKOUT_ROOMS_ADD_LISTENER,
    _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER,
    _UPDATE_PRESET_BREAKOUT_ROOMS
} from './actionTypes';
import { FEATURE_KEY } from './constants';
import type { IBreakoutPayload } from './types';

const DEFAULT_STATE = {
    enablePresetBreakoutRoom: false,
    presetRoomData: {
        groupId: -1,
        meetingCode: -1,
        meetingData: {}
    },
    msgListener: [],
    availableToSetup: {
        cleanRoomReady: false,
        createRoomReady: false,
        participantsReady: false,
    },
};

export type IPresetBreakoutRoomsState = {
    availableToSetup: {
        cleanRoomReady: boolean;
        createRoomReady: boolean;
        participantsReady: boolean;
    };
    enablePresetBreakoutRoom: boolean;
    msgListener: Array<(params?: unknown) => void>;
    presetRoomData: IBreakoutPayload;
};

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register<IPresetBreakoutRoomsState>(FEATURE_KEY, (state = DEFAULT_STATE, action): IPresetBreakoutRoomsState => {
    const { type, payload } = action;

    switch (type) {
    case _ENABlE_PRESET_BREAKOUT_ROOMS:
        logger.debug('[GTS] reducer: _ENABlE_PRESET_BREAKOUT_ROOMS', payload);

        return {
            ...state,
            enablePresetBreakoutRoom: payload
        };

    case _UPDATE_PRESET_BREAKOUT_ROOMS:
        logger.debug('[GTS] reducer: _UPDATE_PRESET_BREAKOUT_ROOMS', payload);

        return {
            ...state,
            presetRoomData: payload
        };

    case _PRESET_BREAKOUT_ROOMS_ADD_LISTENER:
        logger.debug('[GTS] reducer: _PRESET_BREAKOUT_ROOMS_ADD_LISTENER');

        return {
            ...state,
            msgListener: [
                ...state.msgListener,
                payload
            ]
        };

    case _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER:
        logger.debug('[GTS] reducer: _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER');
        state.msgListener.forEach(listener => listener());

        return {
            ...state,
            msgListener: []
        };

    case _AVAILABLE_TO_SET_BREAKOUT_ROOMS:
        return {
            ...state,
            availableToSetup: payload
        };
    }

    return state;
});
