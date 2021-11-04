// @flow

import {
    CLAP_SOUND_FILES,
    LAUGH_SOUND_FILES,
    LIKE_SOUND_FILES,
    BOO_SOUND_FILES,
    SURPRISE_SOUND_FILES,
    SILENCE_SOUND_FILES
} from './sounds';

/**
 * The payload name for the datachannel/endpoint reaction event.
 */
export const ENDPOINT_REACTION_NAME = 'endpoint-reaction';

/**
 * The prefix for all reaction sound IDs. Also the ID used in config to disable reaction sounds.
 */
export const REACTION_SOUND = 'REACTION_SOUND';

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new laugh reaction is received.
 *
 * @type { string }
 */
export const LAUGH_SOUND_ID = `${REACTION_SOUND}_LAUGH_`;

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new clap reaction is received.
 *
 * @type {string}
 */
export const CLAP_SOUND_ID = `${REACTION_SOUND}_CLAP_`;

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new like reaction is received.
 *
 * @type {string}
 */
export const LIKE_SOUND_ID = `${REACTION_SOUND}_LIKE_`;

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new boo reaction is received.
 *
 * @type {string}
 */
export const BOO_SOUND_ID = `${REACTION_SOUND}_BOO_`;

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new surprised reaction is received.
 *
 * @type {string}
 */
export const SURPRISE_SOUND_ID = `${REACTION_SOUND}_SURPRISE_`;

/**
 * The audio ID prefix of the audio element for which the {@link playAudio} action is
 * triggered when a new silence reaction is received.
 *
 * @type {string}
 */
export const SILENCE_SOUND_ID = `${REACTION_SOUND}_SILENCE_`;

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when a new raise hand event is received.
 *
 * @type {string}
 */
export const RAISE_HAND_SOUND_ID = 'RAISE_HAND_SOUND';

export type ReactionEmojiProps = {

    /**
     * Reaction to be displayed.
     */
    reaction: string,

    /**
     * Id of the reaction.
     */
    uid: number
}

export const SOUNDS_THRESHOLDS = [ 1, 4, 10 ];


export const REACTIONS = {
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        shortcutChar: 'T',
        soundId: LIKE_SOUND_ID,
        soundFiles: LIKE_SOUND_FILES
    },
    clap: {
        message: ':clap:',
        emoji: '👏',
        shortcutChar: 'C',
        soundId: CLAP_SOUND_ID,
        soundFiles: CLAP_SOUND_FILES
    },
    laugh: {
        message: ':grinning_face:',
        emoji: '😀',
        shortcutChar: 'L',
        soundId: LAUGH_SOUND_ID,
        soundFiles: LAUGH_SOUND_FILES
    },
    surprised: {
        message: ':face_with_open_mouth:',
        emoji: '😮',
        shortcutChar: 'O',
        soundId: SURPRISE_SOUND_ID,
        soundFiles: SURPRISE_SOUND_FILES
    },
    boo: {
        message: ':slightly_frowning_face:',
        emoji: '🙁',
        shortcutChar: 'B',
        soundId: BOO_SOUND_ID,
        soundFiles: BOO_SOUND_FILES
    },
    silence: {
        message: ':face_without_mouth:',
        emoji: '😶',
        shortcutChar: 'S',
        soundId: SILENCE_SOUND_ID,
        soundFiles: SILENCE_SOUND_FILES
    }
};
