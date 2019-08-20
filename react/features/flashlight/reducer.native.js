// @flow

import { ReducerRegistry } from '../base/redux';
import { TOGGLE_FLASHLIGHT } from './actionTypes';
import Torch from 'react-native-torch';

/**
 * Initial state for flashlight.
 */
export const _FLASHLIGHT_STATE = {
    isFlashlightOn: false
};

/**
 * Reduces the Redux actions of the feature features/flashlight.
 */
ReducerRegistry.register('features/flashlight', (state = _FLASHLIGHT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_FLASHLIGHT: {
        const flashlight = !state.isFlashlightOn;

        Torch.switchState(flashlight);

        return {
            ...state,
            isFlashlightOn: flashlight
        };
    }
    }

    return state;
});


