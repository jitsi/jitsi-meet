import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_FACE_EXPRESSION,
    ADD_TO_FACE_EXPRESSIONS_BUFFER,
    CLEAR_FACE_EXPRESSIONS_BUFFER,
    UPDATE_FACE_COORDINATES
} from './actionTypes';
import { FaceBox } from './types';

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
    faceBoxes: { [key: string]: FaceBox; };
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

ReducerRegistry.register<IFaceLandmarksState>('features/face-landmarks',
(state = defaultState, action): IFaceLandmarksState => {
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
