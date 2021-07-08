// @flow

export const REACTIONS = {
    clap: {
        message: ':clap:',
        emoji: '👏',
        shortcutChar: 'C'
    },
    like: {
        message: ':thumbs_up:',
        emoji: '👍',
        shortcutChar: 'T'
    },
    smile: {
        message: ':smile:',
        emoji: '😀',
        shortcutChar: 'S'
    },
    joy: {
        message: ':joy:',
        emoji: '😂',
        shortcutChar: 'L'
    },
    surprised: {
        message: ':face_with_open_mouth:',
        emoji: '😮',
        shortcutChar: 'O'
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
