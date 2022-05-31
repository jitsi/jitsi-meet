import {
    ADD_REACTION_BUFFER,
    ADD_REACTION_MESSAGE,
    FLUSH_REACTION_BUFFER,
    PUSH_REACTIONS,
    SEND_REACTIONS,
    SET_REACTION_QUEUE
} from './actionTypes';
import { ReactionEmojiProps } from './constants';
import { ReactionsAction } from './reducer';

/**
 * Sets the reaction queue.
 *
 * @param {Array} queue - The new queue.
 */
export function setReactionQueue(queue: Array<ReactionEmojiProps>): ReactionsAction {
    return {
        type: SET_REACTION_QUEUE,
        queue
    };
}


/**
 * Removes a reaction from the queue.
 *
 * @param {number} uid - Id of the reaction to be removed.
 */
export function removeReaction(uid: number): Function {
    return (dispatch: Function, getState: Function) => {
        const queue = getState()['features/reactions'].queue;

        dispatch(setReactionQueue(queue.filter(reaction => reaction.uid !== uid)));
    };
}


/**
 * Sends the reactions buffer to everyone in the conference.
 */
export function sendReactions(): ReactionsAction {
    return {
        type: SEND_REACTIONS
    };
}

/**
 * Adds a reaction to the local buffer.
 *
 * @param {string} reaction - The reaction to be added.
 */
export function addReactionToBuffer(reaction: string): Object {
    return {
        type: ADD_REACTION_BUFFER,
        reaction
    };
}

/**
 * Clears the reaction buffer.
 */
export function flushReactionBuffer(): ReactionsAction {
    return {
        type: FLUSH_REACTION_BUFFER
    };
}

/**
 * Adds a reaction message to the chat.
 *
 * @param {string} message - The reaction message.
 */
export function addReactionsToChat(message: string): Object {
    return {
        type: ADD_REACTION_MESSAGE,
        message
    };
}

/**
 * Adds reactions to the animation queue.
 *
 * @param {Array} reactions - The reactions to be animated.
 */
export function pushReactions(reactions: Array<string>): Object {
    return {
        type: PUSH_REACTIONS,
        reactions
    };
}
