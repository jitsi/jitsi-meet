// @flow

import { ReducerRegistry, PersistenceRegistry } from '../base/redux';

import {
    GREEN_SCREEN_ENABLED,
    GREEN_SCREEN_DISABLED,
    GREEN_SCREEN_CHANGED,
    GREEN_SCREEN_MASK_UPDATED,
    GREEN_SCREEN_TYPE_UPDATED,
    GREEN_SCREEN_OUTPUT_STRIDE_UPDATED,
    GREEN_SCREEN_MULTIPLIER_UPDATED,
    GREEN_SCREEN_QUANT_BYTES_UPDATED,
    GREEN_SCREEN_CHROMA_KEY_UPDATED,
    GREEN_SCREEN_CHROMA_THRESHOLD_UPDATED,
    GREEN_SCREEN_FPS_UPDATED,
    GREEN_SCREEN_INTERNAL_RESOLUTION_UPDATED
} from './actionTypes';

const STORE_NAME = 'features/green-screen/settings';

PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = {}, action) => {

    switch (action.type) {
    case GREEN_SCREEN_ENABLED: {
        return {
            ...state,
            enabled: true
        };
    }
    case GREEN_SCREEN_DISABLED: {
        return {
            ...state,
            enabled: false
        };
    }
    case GREEN_SCREEN_CHANGED: {
        return {
            ...state,
            image: action.data
        };
    }
    case GREEN_SCREEN_TYPE_UPDATED: {
        return {
            ...state,
            algorithmType: action.algorithmType
        };
    }
    case GREEN_SCREEN_OUTPUT_STRIDE_UPDATED: {
        return {
            ...state,
            outputStride: action.outputStride
        };
    }
    case GREEN_SCREEN_MULTIPLIER_UPDATED: {
        return {
            ...state,
            multiplier: action.multiplier
        };
    }
    case GREEN_SCREEN_QUANT_BYTES_UPDATED: {
        return {
            ...state,
            quantBytes: action.quantBytes
        };
    }
    case GREEN_SCREEN_CHROMA_KEY_UPDATED: {
        return {
            ...state,
            chromaKey: action.chromaKey
        };
    }
    case GREEN_SCREEN_CHROMA_THRESHOLD_UPDATED: {
        return {
            ...state,
            chromaThreshold: action.chromaThreshold
        };
    }
    case GREEN_SCREEN_FPS_UPDATED: {
        return {
            ...state,
            fps: action.fps
        };
    }
    case GREEN_SCREEN_INTERNAL_RESOLUTION_UPDATED: {
        return {
            ...state,
            internalResolution: action.internalResolution
        };
    }
    }

    return state;
});

ReducerRegistry.register('features/green-screen/mask', (state = {}, action) => {

    switch (action.type) {
    case GREEN_SCREEN_MASK_UPDATED: {
        return {
            ...state,
            data: action.data
        };
    }
    }

    return state;
});
