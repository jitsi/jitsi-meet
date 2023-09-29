import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_FACE_LANDMARKS,
    CLEAR_FACE_LANDMARKS_BUFFER,
    UPDATE_FACE_COORDINATES
} from './actionTypes';
import { FaceBox, FaceLandmarks } from './types';

const defaultState = {
    faceBoxes: {},
    faceLandmarks: [],
    faceLandmarksBuffer: [],
    recognitionActive: false
};

export interface IFaceLandmarksState {
    faceBoxes: { [key: string]: FaceBox; };
    faceLandmarks: Array<FaceLandmarks>;
    faceLandmarksBuffer: Array<{
        emotion: string;
        timestamp: number;
    }>;
    recognitionActive: boolean;
}

ReducerRegistry.register<IFaceLandmarksState>('features/face-landmarks',
(state = defaultState, action): IFaceLandmarksState => {
    switch (action.type) {
    case ADD_FACE_LANDMARKS: {
        const { addToBuffer, faceLandmarks }: { addToBuffer: boolean; faceLandmarks: FaceLandmarks; } = action;

        return {
            ...state,
            faceLandmarks: [ ...state.faceLandmarks, faceLandmarks ],
            faceLandmarksBuffer: addToBuffer ? [ ...state.faceLandmarksBuffer,
                {
                    emotion: faceLandmarks.faceExpression,
                    timestamp: faceLandmarks.timestamp
                } ] : state.faceLandmarksBuffer
        };
    }
    case CLEAR_FACE_LANDMARKS_BUFFER: {
        return {
            ...state,
            faceLandmarksBuffer: []
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
