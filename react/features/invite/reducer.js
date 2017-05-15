import {
    ReducerRegistry
} from '../base/redux';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_REQUEST,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';

const DEFAULT_STATE = {
    numbersEnabled: true
};

ReducerRegistry.register(
    'features/invite/dial-in',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case UPDATE_DIAL_IN_NUMBERS_FAILED: {
            return {
                ...state,
                error: action.error,
                loading: false
            };
        }

        case UPDATE_DIAL_IN_NUMBERS_REQUEST: {
            return {
                ...state,
                error: null,
                loading: true
            };
        }
        case UPDATE_DIAL_IN_NUMBERS_SUCCESS: {
            const { numbers, numbersEnabled } = action.response;

            return {
                error: null,
                loading: false,
                numbers,
                numbersEnabled
            };
        }
        }

        return state;
    });
