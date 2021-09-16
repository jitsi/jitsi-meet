// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_FACIAL_RECOGNITION_MODELS_LOADED,
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED,
    UPDATE_CAMERA_TIME_TRACKER
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
    lastFacialExpression: null,
    cameraTimeTracker: {
        muted: true,
        cameraTime: 0,
        lastCameraUpdate: 0
    }
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
        if (state.lastFacialExpression) {
            state.facialExpressions[state.lastFacialExpression] += action.duration;
        }

        return {
            ...state,
            lastFacialExpression: action.facialExpression
        };
    }
    case SET_FACIAL_RECOGNITION_ALLOWED: {
        return {
            ...state,
            facialRecognitionAllowed: action.payload
        };
    }
    case UPDATE_CAMERA_TIME_TRACKER: {
        if (action.muted && state.cameraTimeTracker.lastCameraUpdate !== 0) {
            state.cameraTimeTracker.cameraTime += action.lastCameraUpdate - state.cameraTimeTracker.lastCameraUpdate;
        }
        state.cameraTimeTracker.muted = action.muted;
        state.cameraTimeTracker.lastCameraUpdate = action.lastCameraUpdate;

        return state;
    }
    }

    return state;
});
