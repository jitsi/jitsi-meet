import {
    ReducerRegistry
} from '../base/redux';

import {
    CANCEL_FEEDBACK,
    SET_SHOULD_SHOW_POST_CALL_FEEDBACK,
    SUBMIT_FEEDBACK
} from './actionTypes';

const DEFAULT_STATE = {
    message: '',

    // The sentinel value -1 is used to denote no rating has been set and to
    // preserve pre-redux behavior.
    score: -1,
    submitted: false,
    shouldShowPostCallFeedbackDialog: true
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

        case SET_SHOULD_SHOW_POST_CALL_FEEDBACK: {
            return {
                ...state,
                shouldShowPostCallFeedbackDialog: action.shouldShow
            };
        }

        case SUBMIT_FEEDBACK: {
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
