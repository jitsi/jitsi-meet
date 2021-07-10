// @flow

import { ReducerRegistry } from '../base/redux';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { FEATURE_KEY } from './constants';

/**
 * Default state for the breakout-rooms feature.
 */
const defaultState = {};

/**
 * Listen for actions for the breakout-rooms feature.
 */
ReducerRegistry.register(FEATURE_KEY, (state = defaultState, action) => {
    switch (action.type) {
    case UPDATE_BREAKOUT_ROOMS: {
        const { nextIndex, rooms } = action;

        return {
            ...state,
            nextIndex,
            rooms
        };
    }
    }

    return state;
});
