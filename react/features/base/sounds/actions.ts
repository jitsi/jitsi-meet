import {
    MUTE_SOUND,
    REGISTER_SOUND,
    UNREGISTER_SOUND,
    _ADD_AUDIO_ELEMENT,
    _REMOVE_AUDIO_ELEMENT
} from './actionTypes';
import { getSoundsPath } from './functions';

/**
 * Registers a new sound for given id and a source object which can be either a
 * path or a raw object depending on the platform (native vs web). It will make
 * the {@link SoundCollection} render extra HTMLAudioElement which will make it
 * available for playback through the {@link playSound} action.
 *
 * @param {string} soundId - The global identifier which identify the sound
 * created for given source object.
 * @param {string} soundName - The name of bundled audio file that will be
 * associated with the given {@code soundId}.
 * @param {Object} options - Optional parameters.
 * @param {boolean} options.loop - True in order to loop the sound.
 * @param {boolean} optional - Whether this sound is optional and should be shown in notifications/settings.
 * @param {boolean} languages - Whether this sound has multiple language versions.
 * @returns {{
 *     type: REGISTER_SOUND,
 *     soundId: string,
 *     src: string,
 *     options: {
 *          loop: boolean
 *     }
 * }}
 */
export function registerSound(
        soundId: string, soundName: string, options: Object = {}, optional: boolean = false, languages: boolean = false) {
    return {
        type: REGISTER_SOUND,
        soundId,
        src: `${getSoundsPath()}/${soundName}`,
        options,
        optional,
        languages
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
export function unregisterSound(soundId: string) {
    return {
        type: UNREGISTER_SOUND,
        soundId
    };
}

/**
 * Mutes or unmutes a sound by soundId.
 *
 * @param {string} soundId - The id of the sound to mute/unmute.
 * @param {boolean} isMuted - Whether to mute (true) or unmute (false) the sound.
 * @returns {{ type: MUTE_SOUND, soundId: string, isMuted: boolean }}
 */
export function muteSound(soundId: string, isMuted: boolean) {
    return {
        type: MUTE_SOUND,
        soundId,
        isMuted
    };
}
