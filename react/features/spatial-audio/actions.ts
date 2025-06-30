import { getSpatialAudioManager } from './SpatialAudioManager';
import { SpatialAudioType, ISpatialAudioSettings } from './types';

/**
 * Action types
 */
export const SPATIAL_AUDIO_ENABLE = 'SPATIAL_AUDIO_ENABLE';
export const SPATIAL_AUDIO_DISABLE = 'SPATIAL_AUDIO_DISABLE';
export const SPATIAL_AUDIO_SET_TYPE = 'SPATIAL_AUDIO_SET_TYPE';
export const SPATIAL_AUDIO_UPDATE_SETTINGS = 'SPATIAL_AUDIO_UPDATE_SETTINGS';

/**
 * Enable spatial audio
 */
export function enableSpatialAudio() {
    return (dispatch: any) => {
        const manager = getSpatialAudioManager();
        manager.setEnabled(true);
        
        dispatch({
            type: SPATIAL_AUDIO_ENABLE
        });
    };
}

/**
 * Disable spatial audio
 */
export function disableSpatialAudio() {
    return (dispatch: any) => {
        const manager = getSpatialAudioManager();
        manager.setEnabled(false);
        
        dispatch({
            type: SPATIAL_AUDIO_DISABLE
        });
    };
}

/**
 * Set spatial audio type
 */
export function setSpatialAudioType(audioType: SpatialAudioType) {
    return (dispatch: any) => {
        const manager = getSpatialAudioManager();
        manager.switchStrategy(audioType);
        
        dispatch({
            type: SPATIAL_AUDIO_SET_TYPE,
            audioType
        });
    };
}

/**
 * Update spatial audio settings
 */
export function updateSpatialAudioSettings(settings: Partial<ISpatialAudioSettings>) {
    return (dispatch: any) => {
        const manager = getSpatialAudioManager();
        manager.updateSettings(settings);
        
        dispatch({
            type: SPATIAL_AUDIO_UPDATE_SETTINGS,
            settings
        });
    };
}

/**
 * Toggle spatial audio on/off
 */
export function toggleSpatialAudio() {
    return (dispatch: any, getState: any) => {
        const manager = getSpatialAudioManager();
        const currentSettings = manager.getSettings();
        
        if (currentSettings.enabled) {
            dispatch(disableSpatialAudio());
        } else {
            dispatch(enableSpatialAudio());
        }
    };
} 