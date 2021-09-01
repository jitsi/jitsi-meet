// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_FACIAL_RECOGNITION_MODELS_LOADED,
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED
} from './actionTypes';

const defaultState = {
    facialRecognitionModelsLoaded: false,
    facialRecognitionAllowed: false,
    lastFacialExpression: null,
    facialExpressions: {
        happy: 0,
        neutral: 0,
        surprised: 0,
        angry: 0,
        fearful: 0,
        sad: 0
    }
};

ReducerRegistry.register('features/facial-recognition', (state = defaultState, action) => {
    switch (action.type) {
    case SET_FACIAL_RECOGNITION_MODELS_LOADED: {
        return {
            ...state,
            facialRecognitionModelsLoaded: action.payload
        };
    }

    case ADD_FACIAL_EXPRESSION: {
        state.facialExpressions[action.payload]++;

        return {
            ...state,
            lastFacialExpression: action.payload
        };
    }
    case SET_FACIAL_RECOGNITION_ALLOWED: {
        return {
            ...state,
            facialRecognitionAllowed: action.payload
        };
    }
    }

    return state;
});
