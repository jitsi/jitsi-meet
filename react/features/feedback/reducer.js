import {
    ReducerRegistry
} from '../base/redux';

import {
    CANCEL_FEEDBACK,
    SUBMIT_FEEDBACK_ERROR,
    SUBMIT_FEEDBACK_SUCCESS
} from './actionTypes';

const DEFAULT_STATE = {
    message: '',

    // The sentinel value -1 is used to denote no rating has been set and to
    // preserve pre-redux behavior.
    score: -1,
    submitted: false
};

/**
 * Reduces the Redux actions of the feature features/feedback.
 */
ReducerRegistry.register(
    'features/feedback',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case CANCEL_FEEDBACK: {
            return {
                ...state,
                message: action.message,
                score: action.score
            };
        }

        case SUBMIT_FEEDBACK_ERROR:
        case SUBMIT_FEEDBACK_SUCCESS: {
            return {
                ...state,
                message: '',
                score: -1,
                submitted: true
            };
        }
        }

        return state;
    });
