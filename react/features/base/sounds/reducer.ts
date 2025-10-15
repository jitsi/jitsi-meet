import { AnyAction } from 'redux';

import ReducerRegistry from '../redux/ReducerRegistry';

import {
    MUTE_SOUND,
    REGISTER_SOUND,
    UNREGISTER_SOUND,
    _ADD_AUDIO_ELEMENT,
    _REMOVE_AUDIO_ELEMENT
} from './actionTypes';
import SoundService from './components/SoundService';

/**
 * The structure use by this reducer to describe a sound.
 */
export type Sound = {

    /**
     * Whether this sound is muted (isMuted).
     */
    isMuted?: boolean;

    /**
     * Whether this sound has multiple language versions.
     */
    languages?: boolean;

    /**
     * This field is container for all optional parameters related to the sound.
     */
    options?: {
        loop: boolean;
        moderation?: boolean;
        optional?: boolean;
    };

    /**
     * This field describes the source of the audio resource to be played. It
     * can be either a path to the file or an object depending on the platform
     * (native vs web).
     */
    src?: string;
};

/**
 * Initial/default state of the feature {@code base/sounds}. It is a {@code Map}
 * of globally stored sounds.
 *
 * @type {Map<string, Sound>}
 */
const DEFAULT_STATE = new Map();

export type ISoundsState = Map<string, Sound>;

/**
 * The base/sounds feature's reducer.
 */
ReducerRegistry.register<ISoundsState>(
    'features/base/sounds',
    (state = DEFAULT_STATE, action): ISoundsState => {
        switch (action.type) {
        case REGISTER_SOUND:
            return _registerSound(state, action);

        case UNREGISTER_SOUND:
            return _unregisterSound(state, action);

        case MUTE_SOUND:
            return _muteSound(state, action);

        default:
            return state;
        }
    });


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
function _registerSound(state: ISoundsState, action: AnyAction) {
    const nextState = new Map(state);

    nextState.set(action.soundId, {
        src: action.src,
        options: action.options,
        isMuted: action?.isMuted ?? false,
        languages: action.languages ?? false
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
function _unregisterSound(state: ISoundsState, action: AnyAction) {
    const nextState = new Map(state);

    nextState.delete(action.soundId);

    return nextState;
}

/**
 * Mutes or unmutes a sound by soundId.
 *
 * @param {Map<string, Sound>} state - The current Redux state of the sounds feature.
 * @param {MUTE_SOUND} action - The mute sound action.
 * @private
 * @returns {Map<string, Sound>}
 */
function _muteSound(state: ISoundsState, action: AnyAction) {
    const nextState = new Map(state);
    const sound = nextState.get(action.soundId);

    if (sound) {
        SoundService.muteSound(action.soundId, action.isMuted);
        nextState.set(action.soundId, {
            ...sound,
            isMuted: action.isMuted
        });
    }

    return nextState;
}
