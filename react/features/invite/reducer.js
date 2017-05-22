import {
    ReducerRegistry
} from '../base/redux';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
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
                error: action.error
            };
        }

        case UPDATE_DIAL_IN_NUMBERS_SUCCESS: {
            const { numbers, numbersEnabled } = action.dialInNumbers;

            return {
                conferenceId: action.conferenceId.id,
                error: null,
                numbers,
                numbersEnabled
            };
        }
        }

        return state;
    });
