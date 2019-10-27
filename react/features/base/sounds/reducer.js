// @flow

import type { AudioElement } from '../media';
import { assign, ReducerRegistry } from '../redux';

import {
    _ADD_AUDIO_ELEMENT,
    _REMOVE_AUDIO_ELEMENT,
    REGISTER_SOUND,
    UNREGISTER_SOUND
} from './actionTypes';
import logger from './logger';

/**
 * The structure use by this reducer to describe a sound.
 */
export type Sound = {

    /**
     * The HTMLAudioElement which implements the audio playback functionality.
     * Becomes available once the sound resource gets loaded and the sound can
     * not be played until that happens.
     */
    audioElement?: AudioElement,

    /**
     * This field describes the source of the audio resource to be played. It
     * can be either a path to the file or an object depending on the platform
     * (native vs web).
     */
    src: Object | string,

    /**
     * This field is container for all optional parameters related to the sound.
     */
    options: Object
}

/**
 * Initial/default state of the feature {@code base/sounds}. It is a {@code Map}
 * of globally stored sounds.
 *
 * @type {Map<string, Sound>}
 */
const DEFAULT_STATE = new Map();

/**
 * The base/sounds feature's reducer.
 */
ReducerRegistry.register(
    'features/base/sounds',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case _ADD_AUDIO_ELEMENT:
        case _REMOVE_AUDIO_ELEMENT:
            return _addOrRemoveAudioElement(state, action);

        case REGISTER_SOUND:
            return _registerSound(state, action);

        case UNREGISTER_SOUND:
            return _unregisterSound(state, action);

        default:
            return state;
        }
    });

/**
 * Adds or removes {@link AudioElement} associated with a {@link Sound}.
 *
 * @param {Map<string, Sound>} state - The current Redux state of this feature.
 * @param {_ADD_AUDIO_ELEMENT | _REMOVE_AUDIO_ELEMENT} action - The action to be
 * handled.
 * @private
 * @returns {Map<string, Sound>}
 */
function _addOrRemoveAudioElement(state, action) {
    const isAddAction = action.type === _ADD_AUDIO_ELEMENT;
    const nextState = new Map(state);
    const { soundId } = action;

    const sound = nextState.get(soundId);

    if (sound) {
        if (isAddAction) {
            nextState.set(soundId,
                assign(sound, {
                    audioElement: action.audioElement
                }));
        } else {
            nextState.set(soundId,
                assign(sound, {
                    audioElement: undefined
                }));
        }
    } else {
        logger.warn(`${action.type}: no sound for id: ${soundId}`);
    }

    return nextState;
}

/**
 * Registers a new {@link Sound} for given id and source. It will make
 * the {@link SoundCollection} component render HTMLAudioElement for given
 * source making it available for playback through the redux actions.
 *
 * @param {Map<string, Sound>} state - The current Redux state of the sounds
 * features.
 * @param {REGISTER_SOUND} action - The register sound action.
 * @private
 * @returns {Map<string, Sound>}
 */
function _registerSound(state, action) {
    const nextState = new Map(state);

    nextState.set(action.soundId, {
        src: action.src,
        options: action.options
    });

    return nextState;
}

/**
 * Unregisters a {@link Sound} which will make the {@link SoundCollection}
 * component stop rendering the corresponding HTMLAudioElement. This will
 * result further in the audio resource disposal.
 *
 * @param {Map<string, Sound>} state - The current Redux state of this feature.
 * @param {UNREGISTER_SOUND} action - The unregister sound action.
 * @private
 * @returns {Map<string, Sound>}
 */
function _unregisterSound(state, action) {
    const nextState = new Map(state);

    nextState.delete(action.soundId);

    return nextState;
}
