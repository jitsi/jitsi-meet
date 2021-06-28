// @flow

/**
 * Returns the queue of reactions.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getReactionsQueue(state: Object) {
    return state['features/toolbox'].reactions.queue;
}

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
