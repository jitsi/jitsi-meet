// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { SET_FACIAL_RECOGNITION_MODELS_LOADED } from './actionTypes';

const defaultState = {
    facialRecognitionModelsLoaded: false
};

ReducerRegistry.register('features/facial-recognition', (state = defaultState, action) => {
    switch (action.type) {
    case SET_FACIAL_RECOGNITION_MODELS_LOADED: {
        return {
            ...state,
            facialRecognitionModelsLoaded: action.payload
        };
    }
    }

    return state;
});
