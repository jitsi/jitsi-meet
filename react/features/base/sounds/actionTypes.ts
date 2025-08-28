/**
 * The type of a feature/internal/protected (redux) action to add an audio
 * element to the sounds collection state.
 *
 * {
 *     type: _ADD_AUDIO_ELEMENT,
 *     ref: AudioElement,
 *     soundId: string
 * }
 */
export const _ADD_AUDIO_ELEMENT = '_ADD_AUDIO_ELEMENT';

/**
 * The type of feature/internal/protected (redux) action to remove an audio
 * element for given sound identifier from the sounds collection state.
 *
 * {
 *     type: _REMOVE_AUDIO_ELEMENT,
 *     soundId: string
 * }
 */
export const _REMOVE_AUDIO_ELEMENT = '_REMOVE_AUDIO_ELEMENT';

/**
 * The type of (redux) action to play a sound from the sounds collection.
 *
 * {
 *     type: PLAY_SOUND,
 *     soundId: string
 * }
 */
export const PLAY_SOUND = 'PLAY_SOUND';

/**
 * The type of (redux) action to register a new sound with the sounds
 * collection.
 *
 * {
 *     type: REGISTER_SOUND,
 *     soundId: string
 * }
 */
export const REGISTER_SOUND = 'REGISTER_SOUND';

/**
 * The type of (redux) action to stop a sound from the sounds collection.
 *
 * {
 *     type: STOP_SOUND,
 *     soundId: string
 * }
 */
export const STOP_SOUND = 'STOP_SOUND';

/**
 * The type of (redux) action to unregister an existing sound from the sounds
 * collection.
 *
 * {
 *     type: UNREGISTER_SOUND,
 *     soundId: string
 * }
 */
export const UNREGISTER_SOUND = 'UNREGISTER_SOUND';
