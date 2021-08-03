// @flow

export const REACTIONS = {
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        shortcutChar: 'T'
    },
    clap: {
        message: ':clap:',
        emoji: '👏',
        shortcutChar: 'C'
    },
    laugh: {
        message: ':grinning_face:',
        emoji: '😀',
        shortcutChar: 'L'
    },
    surprised: {
        message: ':face_with_open_mouth:',
        emoji: '😮',
        shortcutChar: 'O'
    },
    boo: {
        message: ':slightly_frowning_face:',
        emoji: '🙁',
        shortcutChar: 'B'
    },
    party: {
        message: ':party_popper:',
        emoji: '🎉',
        shortcutChar: 'P'
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
