import ReducerRegistry from '../base/redux/ReducerRegistry';

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

export interface IFeedbackState {
    message: string;
    score: number;
    submitted: boolean;
}

/**
 * Reduces the Redux actions of the feature features/feedback.
 */
ReducerRegistry.register<IFeedbackState>(
    'features/feedback',
    (state = DEFAULT_STATE, action): IFeedbackState => {
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
