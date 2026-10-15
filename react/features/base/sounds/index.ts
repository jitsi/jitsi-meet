/**
 * Public API exports for the base/sounds feature.
 *
 * This module exports both the SoundManager utilities and the Redux action creators.
 *
 * - playSound/stopSound from actions.ts are Redux action creators (thunks)
 * - Direct SoundManager functions are also exported for advanced usage
 * - The middleware connects Redux actions to the SoundManager implementation.
 */

// SoundManager utilities (for advanced usage or initialization)
export {
    init as initSoundManager,
    getAudioElementCount,
    registerSoundUrl,
    unregisterSoundUrl,
    setAudioOutputDevice
} from './SoundManager';

// Re-export Redux actions and action types (primary API - backward compatible)
export * from './actions';
export * from './actionTypes';
