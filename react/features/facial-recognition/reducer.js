// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { SET_FACIAL_RECOGNITION_MODELS_LOADED, ADD_FACIAL_EXPRESSION } from './actionTypes';

const defaultState = {
    facialRecognitionModelsLoaded: false,
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
        return {
            ...state,
            facialExpressions: [ action.payload, ...state.facialExpressions ]
        };
    }
    }

    return state;
});
