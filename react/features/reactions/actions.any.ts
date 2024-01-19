import { IStore } from '../app/types';

import {
    ADD_REACTION_BUFFER,
    ADD_REACTION_MESSAGE,
    FLUSH_REACTION_BUFFER,
    PUSH_REACTIONS,
    SEND_REACTIONS,
    SET_REACTION_QUEUE,
    SHOW_SOUNDS_NOTIFICATION
} from './actionTypes';
import { IReactionEmojiProps } from './constants';
import { IReactionsAction } from './reducer';

/**
 * Sets the reaction queue.
 *
 * @param {Array} queue - The new queue.
 * @returns {IReactionsAction}
 */
export function setReactionQueue(queue: Array<IReactionEmojiProps>): IReactionsAction {
    return {
        type: SET_REACTION_QUEUE,
        queue
    };
}


/**
 * Removes a reaction from the queue.
 *
 * @param {string} uid - Id of the reaction to be removed.
 * @returns {Function}
 */
export function removeReaction(uid: string): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const queue = getState()['features/reactions'].queue;

        dispatch(setReactionQueue(queue.filter((reaction: IReactionEmojiProps) => reaction.uid !== uid)));
    };
}


/**
 * Sends the reactions buffer to everyone in the conference.
 *
 * @returns {IReactionsAction}
 */
export function sendReactions(): IReactionsAction {
    return {
        type: SEND_REACTIONS
    };
}

/**
 * Adds a reaction to the local buffer.
 *
 * @param {string} reaction - The reaction to be added.
 * @returns {IReactionsAction}
 */
export function addReactionToBuffer(reaction: string): IReactionsAction {
    return {
        type: ADD_REACTION_BUFFER,
        reaction
    };
}

/**
 * Clears the reaction buffer.
 *
 * @returns {IReactionsAction}
 */
export function flushReactionBuffer(): IReactionsAction {
    return {
        type: FLUSH_REACTION_BUFFER
    };
}

/**
 * Adds a reaction message to the chat.
 *
 * @param {string} message - The reaction message.
 * @returns {IReactionsAction}
 */
export function addReactionsToChat(message: string): IReactionsAction {
    return {
        type: ADD_REACTION_MESSAGE,
        message
    };
}

/**
 * Adds reactions to the animation queue.
 *
 * @param {Array} reactions - The reactions to be animated.
 * @returns {IReactionsAction}
 */
export function pushReactions(reactions: Array<string>): IReactionsAction {
    return {
        type: PUSH_REACTIONS,
        reactions
    };
}

/**
 * Displays the disable sounds notification.
 *
 * @returns {void}
 */
export function displayReactionSoundsNotification(): IReactionsAction {
    return {
        type: SHOW_SOUNDS_NOTIFICATION
    };
}
