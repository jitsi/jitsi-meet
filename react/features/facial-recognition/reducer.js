// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ADD_FACIAL_EXPRESSION,
    SET_DETECTION_TIME_INTERVAL,
    SET_FACIAL_RECOGNITION_ALLOWED,
    START_FACIAL_RECOGNITION,
    STOP_FACIAL_RECOGNITION
} from './actionTypes';

const defaultState = {
    facialRecognitionModelsLoaded: false,
    facialRecognitionAllowed: false,
    facialExpressions: {
        happy: 0,
        neutral: 0,
        surprised: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        sad: 0
    },
    detectionTimeInterval: -1,
    recognitionActive: false,
    cameraTimeTracker: {
        muted: true,
        cameraTime: 0,
        lastCameraUpdate: 0
    }
};

ReducerRegistry.register('features/facial-recognition', (state = defaultState, action) => {
    switch (action.type) {
    case ADD_FACIAL_EXPRESSION: {
        state.facialExpressions[action.facialExpression] += action.duration;

        return state;
    }
    case SET_FACIAL_RECOGNITION_ALLOWED: {
        return {
            ...state,
            facialRecognitionAllowed: action.allowed
        };
    }
    case SET_DETECTION_TIME_INTERVAL: {
        return {
            ...state,
            detectionTimeInterval: action.time
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
    }

    return state;
});
