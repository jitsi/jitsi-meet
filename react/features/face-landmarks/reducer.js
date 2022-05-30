// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_FACE_EXPRESSION,
    ADD_TO_FACE_EXPRESSIONS_BUFFER,
    CLEAR_FACE_EXPRESSIONS_BUFFER,
    SET_MAX_NO_FACES,
    START_FACE_LANDMARKS_DETECTION,
    STOP_FACE_LANDMARKS_DETECTION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';

const defaultState = {
    faceBoxes: {},
    faceExpressions: {
        happy: 0,
        neutral: 0,
        surprised: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        sad: 0
    },
    faceExpressionsBuffer: [],
    maxNoFaces: 0,
    recognitionActive: false
};

ReducerRegistry.register('features/face-landmarks', (state = defaultState, action) => {
    switch (action.type) {
    case ADD_FACE_EXPRESSION: {
        return {
            ...state,
            faceExpressions: {
                ...state.faceExpressions,
                [action.faceExpression]: state.faceExpressions[action.faceExpression] + action.duration
            }
        };
    }
    case ADD_TO_FACE_EXPRESSIONS_BUFFER: {
        return {
            ...state,
            faceExpressionsBuffer: [ ...state.faceExpressionsBuffer, action.faceExpression ]
        };
    }
    case CLEAR_FACE_EXPRESSIONS_BUFFER: {
        return {
            ...state,
            faceExpressionsBuffer: []
        };
    }
    case SET_MAX_NO_FACES: {
        return {
            ...state,
            maxNoFaces: action.maxNoFaces
        };
    }
    case START_FACE_LANDMARKS_DETECTION: {
        return {
            ...state,
            recognitionActive: true
        };
    }
    case STOP_FACE_LANDMARKS_DETECTION: {
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
