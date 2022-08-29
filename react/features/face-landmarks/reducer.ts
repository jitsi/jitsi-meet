import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_FACE_EXPRESSION,
    ADD_TO_FACE_EXPRESSIONS_BUFFER,
    CLEAR_FACE_EXPRESSIONS_BUFFER,
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
    recognitionActive: false
};

export interface IFaceLandmarksState {
    faceBoxes: {
        left?: number;
        right?: number;
        width?: number;
    };
    faceExpressions: {
        angry: number;
        disgusted: number;
        fearful: number;
        happy: number;
        neutral: number;
        sad: number;
        surprised: number;
    };
    faceExpressionsBuffer: Array<{
        emotion: string;
        timestamp: string;
    }>;
    recognitionActive: boolean;
}

ReducerRegistry.register('features/face-landmarks', (state: IFaceLandmarksState = defaultState, action) => {
    switch (action.type) {
    case ADD_FACE_EXPRESSION: {
        return {
            ...state,
            faceExpressions: {
                ...state.faceExpressions,
                [action.faceExpression]: state.faceExpressions[
                    action.faceExpression as keyof typeof state.faceExpressions] + action.duration
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
