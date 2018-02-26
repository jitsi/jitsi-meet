// @flow

import type { AudioElement } from '../media';

import {
    _ADD_AUDIO_ELEMENT,
    _REMOVE_AUDIO_ELEMENT,
    PLAY_SOUND,
    REGISTER_SOUND,
    UNREGISTER_SOUND
} from './actionTypes';

/**
 * Adds {@link AudioElement} instance to the base/sounds feature state for the
 * {@link Sound} instance identified by the given id. After this action the
 * sound can be played by dispatching the {@link PLAY_SOUND} action.
 *
 * @param {string} soundId - The sound identifier for which the audio element
 * will be stored.
 * @param {AudioElement} audioElement - The audio element which implements the
 * audio playback functionality and which is backed by the sound resource
 * corresponding to the {@link Sound} with the given id.
 * @protected
 * @returns {{
 *     type: PLAY_SOUND,
 *     audioElement: AudioElement,
 *     soundId: string
 * }}
 */
export function _addAudioElement(soundId: string, audioElement: AudioElement) {
    return {
        type: _ADD_AUDIO_ELEMENT,
        audioElement,
        soundId
    };
}

/**
 * The opposite of {@link _addAudioElement} which removes {@link AudioElement}
 * for given sound from base/sounds state. It means that the audio resource has
 * been disposed and the sound can no longer be played.
 *
 * @param {string} soundId - The {@link Sound} instance identifier for which the
 * audio element is being removed.
 * @protected
 * @returns {{
 *     type: _REMOVE_AUDIO_ELEMENT,
 *     soundId: string
 * }}
 */
export function _removeAudioElement(soundId: string) {
    return {
        type: _REMOVE_AUDIO_ELEMENT,
        soundId
    };
}

/**
 * Starts playback of the sound identified by the given sound id. The action
 * will have effect only if the audio resource has been loaded already.
 *
 * @param {string} soundId - The id of the sound to be played (the same one
 * which was used in {@link registerSound} to register the sound).
 * @returns {{
 *     type: PLAY_SOUND,
 *     soundId: string
 * }}
 */
export function playSound(soundId: string): Object {
    return {
        type: PLAY_SOUND,
        soundId
    };
}

/**
 * Registers a new sound for given id and a source object which can be either a
 * path or a raw object depending on the platform (native vs web). It will make
 * the {@link SoundCollection} render extra HTMLAudioElement which will make it
 * available for playback through the {@link playSound} action.
 *
 * @param {string} soundId - The global identifier which identify the sound
 * created for given source object.
 * @param {Object|string} src - Either path to an audio file or a raw object
 * which specifies the audio resource that will be associated with the given
 * {@code soundId}.
 * @returns {{
 *     type: REGISTER_SOUND,
 *     soundId: string,
 *     src: (Object | string)
 * }}
 */
export function registerSound(soundId: string, src: Object | string): Object {
    return {
        type: REGISTER_SOUND,
        soundId,
        src
    };
}

/**
 * Unregister the sound identified by the given id. It will make the
 * {@link SoundCollection} component stop rendering the corresponding
 * {@code HTMLAudioElement} which then should result in the audio resource
 * disposal.
 *
 * @param {string} soundId - The identifier of the {@link Sound} to be removed.
 * @returns {{
 *     type: UNREGISTER_SOUND,
 *     soundId: string
 * }}
 */
export function unregisterSound(soundId: string): Object {
    return {
        type: UNREGISTER_SOUND,
        soundId
    };
}
