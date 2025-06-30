/**
 * Spatial Audio Module
 * 
 * This module provides a centralized system for managing spatial audio in Jitsi Meet.
 * It supports multiple audio strategies (HRTF, Stereo, Equalpower, None) and handles
 * participant positioning automatically.
 */

// Main manager
export { SpatialAudioManager, getSpatialAudioManager } from './SpatialAudioManager';

// Types and interfaces
export type {
    SpatialAudioType,
    ISpatialPosition,
    IParticipantAudioData,
    IPanningStrategy,
    ILayoutStrategy,
    ISpatialAudioSettings,
    ISpatialAudioEvents,
    SpatialAudioEventType,
    SpatialAudioEventHandler
} from './types';

// Strategies
export { HRTFPanningStrategy } from './strategies/HRTFPanningStrategy';
export { StereoPanningStrategy } from './strategies/StereoPanningStrategy';
export { EqualpowerPanningStrategy } from './strategies/EqualpowerPanningStrategy';
export { NonePanningStrategy } from './strategies/NonePanningStrategy';

// Layouts
export { GridLayoutStrategy } from './layouts/GridLayoutStrategy';

// Redux actions and reducers
export * from './actions';
export { default as spatialAudioReducers } from './reducer';

// Components
export { default as SpatialAudioControls } from './components/SpatialAudioControls';

// Debug utilities
export { SpatialAudioDebug } from './debug'; 