import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_GOOGLE_API_PROFILE,
    SET_GOOGLE_API_STATE
} from './actionTypes';
import { GOOGLE_API_STATES } from './constants';

/**
 * The default state is the Google API needs loading.
 *
 * @type {{googleAPIState: number}}
 */
const DEFAULT_STATE = {
    googleAPIState: GOOGLE_API_STATES.NEEDS_LOADING,
    profileEmail: ''
};

export interface IGoogleApiState {
    googleAPIState: number;
    googleResponse?: Object;
    profileEmail: string;
}

/**
 * Reduces the Redux actions of the feature features/google-api.
 */
ReducerRegistry.register<IGoogleApiState>('features/google-api',
    (state = DEFAULT_STATE, action): IGoogleApiState => {
        switch (action.type) {
        case SET_GOOGLE_API_STATE:
            return {
                ...state,
                googleAPIState: action.googleAPIState,
                googleResponse: action.googleResponse
            };
        case SET_GOOGLE_API_PROFILE:
            return {
                ...state,
                profileEmail: action.profileEmail
            };
        }

        return state;
    });
