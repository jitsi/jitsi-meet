// @ts-ignore
import { ReducerRegistry } from '../base/redux';

import {
    TOGGLE_REACTIONS_VISIBLE,
    SET_REACTION_QUEUE,
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SHOW_SOUNDS_NOTIFICATION
} from './actionTypes';
import { ReactionEmojiProps } from './constants';

interface State {
    /**
     * The indicator that determines whether the reactions menu is visible.
     */
    visible: boolean,
    /**
     * An array that contains the reactions buffer to be sent.
     */
    buffer: Array<string>,
    /**
     * A number, non-zero value which identifies the timer created by a call
     * to setTimeout().
     */
    timeoutID: number|null,
    /**
    * The array of reactions to animate.
    */
    queue: Array<ReactionEmojiProps>,

    /**
     * Whether or not the disable reaction sounds notification was shown.
     */
    notificationDisplayed: boolean
}

export interface ReactionsAction extends Partial<State> {
    /**
     * The message to be added to the chat.
     */
    message?: string,
    /**
     * The reaction to be added to buffer.
     */
    reaction?: string,
    /**
     * The reactions to be added to the animation queue.
     */
    reactions?: Array<string>,
    /**
     * The action type.
     */
    type: string
}

/**
 * Returns initial state for reactions' part of Redux store.
 *
 * @private
 */
function _getInitialState(): State {
    return {
        visible: false,
        buffer: [],
        timeoutID: null,
        queue: [],
        notificationDisplayed: false
    };
}

ReducerRegistry.register(
    'features/reactions',
    (state: State = _getInitialState(), action: ReactionsAction) => {
        switch (action.type) {

        case TOGGLE_REACTIONS_VISIBLE:
            return {
                ...state,
                visible: !state.visible
            };

        case ADD_REACTION_BUFFER:
            return {
                ...state,
                buffer: action.buffer,
                timeoutID: action.timeoutID
            };

        case FLUSH_REACTION_BUFFER:
            return {
                ...state,
                buffer: [],
                timeoutID: null
            };

        case SET_REACTION_QUEUE: {
            return {
                ...state,
                queue: action.queue
            };
        }

        case SHOW_SOUNDS_NOTIFICATION: {
            return {
                ...state,
                notificationDisplayed: true
            };
        }
        }

        return state;
    });
