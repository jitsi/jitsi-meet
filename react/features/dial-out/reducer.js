import {
    ReducerRegistry
} from '../base/redux';

import {
    DIAL_OUT_CANCELED,
    DIAL_OUT_CODES_UPDATED,
    DIAL_OUT_SERVICE_FAILED,
    PHONE_NUMBER_CHECKED
} from './actionTypes';

const DEFAULT_STATE = {
    dialOutCodes: null,
    error: null,
    isDialNumberAllowed: true
};

ReducerRegistry.register(
    'features/dial-out',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case DIAL_OUT_CANCELED: {
            return DEFAULT_STATE;
        }
        case DIAL_OUT_CODES_UPDATED: {
            return {
                ...state,
                error: null,
                dialOutCodes: action.response
            };
        }
        case DIAL_OUT_SERVICE_FAILED: {
            return {
                ...state,
                error: action.error
            };
        }
        case PHONE_NUMBER_CHECKED: {
            return {
                ...state,
                error: null,
                isDialNumberAllowed: action.response.allow
            };
        }
        }

        return state;
    });
