// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_FACIAL_EXPRESSION,
    ADD_TO_FACIAL_EXPRESSIONS_BUFFER,
    CLEAR_FACIAL_EXPRESSIONS_BUFFER,
    START_FACIAL_RECOGNITION,
    STOP_FACIAL_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';

const defaultState = {
    faceBoxes: {},
    facialExpressions: {
        happy: 0,
        neutral: 0,
        surprised: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        sad: 0
    },
    facialExpressionsBuffer: [],
    recognitionActive: false
};

ReducerRegistry.register('features/facial-recognition', (state = defaultState, action) => {
    switch (action.type) {
    case ADD_FACIAL_EXPRESSION: {
        state.facialExpressions[action.facialExpression] += action.duration;

        return state;
    }
    case ADD_TO_FACIAL_EXPRESSIONS_BUFFER: {
        return {
            ...state,
            facialExpressionsBuffer: [ ...state.facialExpressionsBuffer, action.facialExpression ]
        };
    }
    case CLEAR_FACIAL_EXPRESSIONS_BUFFER: {
        return {
            ...state,
            facialExpressionsBuffer: []
        };
    }
    case START_FACIAL_RECOGNITION: {
        return {
            ...state,
            recognitionActive: true
        };
    }
    case STOP_FACIAL_RECOGNITION: {
        return {
            ...state,
            recognitionActive: false
        };
    }
    case UPDATE_FACE_COORDINATES: {
        return {
            ...state,
            faceBoxes: {
                ...state.faceBoxes,
                [action.id]: action.faceBox
            }
        };
    }
    }

    return state;
});
