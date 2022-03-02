import { ReducerRegistry } from '../base/redux';

import {
    START_FACE_RECOGNITION,
    STOP_FACE_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';

/**
 * The default state object.
 */
const defaultState = {
    /**
     * Map of participant ids containing their respective facebox in the shape of a left, right, bottom, top percentages
     * The percentages indicate the distance of the detected face starting edge (top or left) to the corresponding edge.
     *
     * Examples:
     * 70% left indicates a 70% distance from the left edge of the video to the left edge of the detected face.
     * 70% right indicates a 70% distance from the right edge of the video to the left edge of the detected face.
     * 30% top indicates a 30% distance from the top edge of the video to the top edge of the detected face.
     * 30% bottom indicates a 30% distance from the bottom edge of the video to the top edge of the detected face.
     */
    faceBoxes: {},

    /**
     * Flag indicating whether face recognition is currently running.
     */
    recognitionActive: false
};

ReducerRegistry.register('features/face-centering', (state = defaultState, action) => {
    switch (action.type) {
    case UPDATE_FACE_COORDINATES: {
        return {
            ...state,
            faceBoxes: {
                ...state.faceBoxes,
                [action.id]: action.faceBox
            }
        };
    }
    case START_FACE_RECOGNITION: {
        return {
            ...state,
            recognitionActive: true
        };
    }

    case STOP_FACE_RECOGNITION: {
        return defaultState;
    }
    }

    return state;
});
