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
    facialExpressions: []
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
        state.facialExpressions.push(action.payload);

        return state;
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
