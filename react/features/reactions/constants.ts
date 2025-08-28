import {
    BOO_SOUND_FILES,
    CLAP_SOUND_FILES,
    HEART_SOUND_FILES,
    LAUGH_SOUND_FILES,
    LIKE_SOUND_FILES,
    SILENCE_SOUND_FILES,
    SURPRISE_SOUND_FILES
} from './sounds';

/**
 * The height of the raise hand row in the reactions menu.
 */
export const RAISE_HAND_ROW_HEIGHT = 54;

/**
 * The height of the gifs menu when displayed as part of the overflow menu.
 */
export const GIFS_MENU_HEIGHT_IN_OVERFLOW_MENU = 200;

/**
 * Reactions menu height when displayed as part of drawer.
 */
export const REACTIONS_MENU_HEIGHT_DRAWER = 144;

/**
 * Reactions menu height when displayed as part of overflow menu.
 */
export const REACTIONS_MENU_HEIGHT_IN_OVERFLOW_MENU = 106;

/**
 * The payload name for the datachannel/endpoint reaction event.
 */
export const ENDPOINT_REACTION_NAME = 'endpoint-reaction';

/**
 * The (name of the) command which transports the state (represented by
 * {State} for the local state at the time of this writing) of a {MuteReactions}
 * (instance) between moderator and participants.
 */
export const MUTE_REACTIONS_COMMAND = 'mute-reactions';

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
export const HEART_SOUND_ID = `${REACTION_SOUND}_HEART_`;

/**
 * The audio ID of the audio element for which the {@link playAudio} action is
 * triggered when a new raise hand event is received.
 *
 * @type {string}
 */
export const RAISE_HAND_SOUND_ID = 'RAISE_HAND_SOUND';

export interface IReactionEmojiProps {

    /**
     * Reaction to be displayed.
     */
    reaction: string;

    /**
     * Id of the reaction.
     */
    uid: string;
}

export const SOUNDS_THRESHOLDS = [ 1, 4, 10 ];

interface IReactions {
    [key: string]: {
        emoji: string;
        message: string;
        shortcutChar: string;
        soundFiles: string[];
        soundId: string;
    };
}

export const REACTIONS: IReactions = {
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
    },
    love: {
        message: ':heart:',
        emoji: '💖',
        shortcutChar: 'H',
        soundId: HEART_SOUND_ID,
        soundFiles: HEART_SOUND_FILES
    }
};

export type ReactionThreshold = {
    reaction: string;
    threshold: number;
};

export interface IMuteCommandAttributes {
    startReactionsMuted?: string;
}
