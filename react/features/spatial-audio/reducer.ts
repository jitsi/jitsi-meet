import { ReducersMapObject } from 'redux';
import { 
    SPATIAL_AUDIO_ENABLE, 
    SPATIAL_AUDIO_DISABLE, 
    SPATIAL_AUDIO_SET_TYPE, 
    SPATIAL_AUDIO_UPDATE_SETTINGS 
} from './actions';
import { SpatialAudioType, ISpatialAudioSettings } from './types';

/**
 * Initial state for spatial audio
 */
const initialState: ISpatialAudioSettings = {
    enabled: false,
    type: 'none',
    masterVolume: 1.0,
    listenerPosition: { x: 0, y: 0, z: 1 },
    listenerOrientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 }
    }
};

/**
 * Spatial audio reducer
 */
export function spatialAudio(state = initialState, action: any): ISpatialAudioSettings {
    switch (action.type) {
        case SPATIAL_AUDIO_ENABLE:
            return {
                ...state,
                enabled: true
            };
            
        case SPATIAL_AUDIO_DISABLE:
            return {
                ...state,
                enabled: false
            };
            
        case SPATIAL_AUDIO_SET_TYPE:
            return {
                ...state,
                type: action.audioType
            };
            
        case SPATIAL_AUDIO_UPDATE_SETTINGS:
            return {
                ...state,
                ...action.settings
            };
            
        default:
            return state;
    }
}

/**
 * Reducers map for spatial audio feature
 */
const spatialAudioReducers: ReducersMapObject = {
    spatialAudio
};

export default spatialAudioReducers; 