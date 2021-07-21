// @flow

import {
    CLAP_SOUND_FILE,
    LAUGH_SOUND_FILE,
    LIKE_SOUND_FILE,
    PARTY_SOUND_FILE,
    BOO_SOUND_FILE,
    SURPRISE_SOUND_FILE
} from './sounds';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new laugh reaction is received.
 *
 * @type { string }
 */
export const LAUGH_SOUND_ID = 'LAUGH_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new clap reaction is received.
 *
 * @type {string}
 */
export const CLAP_SOUND_ID = 'CLAP_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new like reaction is received.
 *
 * @type {string}
 */
export const LIKE_SOUND_ID = 'LIKE_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new boo reaction is received.
 *
 * @type {string}
 */
export const BOO_SOUND_ID = 'BOO_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new surprised reaction is received.
 *
 * @type {string}
 */
export const SURPRISE_SOUND_ID = 'SURPRISE_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new party reaction is received.
 *
 * @type {string}
 */
export const PARTY_SOUND_ID = 'PARTY_SOUND';

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when new raise hand event is received.
 *
 * @type {string}
 */
export const RAISE_HAND_SOUND_ID = 'RAISE_HAND_SOUND';


export const REACTIONS = {
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        shortcutChar: 'T',
        soundId: LIKE_SOUND_ID,
        soundFile: LIKE_SOUND_FILE
    },
    clap: {
        message: ':clap:',
        emoji: '👏',
        shortcutChar: 'C',
        soundId: CLAP_SOUND_ID,
        soundFile: CLAP_SOUND_FILE
    },
    joy: {
        message: ':grinning_face:',
        emoji: '😀',
        shortcutChar: 'L',
        soundId: LAUGH_SOUND_ID,
        soundFile: LAUGH_SOUND_FILE
    },
    surprised: {
        message: ':face_with_open_mouth:',
        emoji: '😮',
        shortcutChar: 'O',
        soundId: SURPRISE_SOUND_ID,
        soundFile: SURPRISE_SOUND_FILE
    },
    boo: {
        message: ':slightly_frowning_face:',
        emoji: '🙁',
        shortcutChar: 'B',
        soundId: BOO_SOUND_ID,
        soundFile: BOO_SOUND_FILE
    },
    party: {
        message: ':party_popper:',
        emoji: '🎉',
        shortcutChar: 'P',
        soundId: PARTY_SOUND_ID,
        soundFile: PARTY_SOUND_FILE
    }
};

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
