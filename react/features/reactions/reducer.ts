import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SET_REACTION_QUEUE,
    SHOW_SOUNDS_NOTIFICATION,
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';
import { IReactionEmojiProps } from './constants';

export interface IReactionsState {

    /**
     * An array that contains the reactions buffer to be sent.
     */
    buffer: Array<string>;

    /**
     * Whether or not the disable reaction sounds notification was shown.
     */
    notificationDisplayed: boolean;

    /**
    * The array of reactions to animate.
    */
    queue: Array<IReactionEmojiProps>;

    /**
     * A number, non-zero value which identifies the timer created by a call
     * to setTimeout().
     */
    timeoutID: number | null;

    /**
     * The indicator that determines whether the reactions menu is visible.
     */
    visible: boolean;
}

export interface IReactionsAction extends Partial<IReactionsState> {

    /**
     * The message to be added to the chat.
     */
    message?: string;

    /**
     * The reaction to be added to buffer.
     */
    reaction?: string;

    /**
     * The reactions to be added to the animation queue.
     */
    reactions?: Array<string>;

    /**
     * The action type.
     */
    type: string;
}

/**
 * Returns initial state for reactions' part of Redux store.
 *
 * @private
 * @returns {IReactionsState}
 */
function _getInitialState(): IReactionsState {
    return {
        visible: false,
        buffer: [],
        timeoutID: null,
        queue: [],
        notificationDisplayed: false
    };
}

ReducerRegistry.register<IReactionsState>(
    'features/reactions',
    (state = _getInitialState(), action: IReactionsAction): IReactionsState => {
        switch (action.type) {

        case TOGGLE_REACTIONS_VISIBLE:
            return {
                ...state,
                visible: !state.visible
            };

        case ADD_REACTION_BUFFER:
            return {
                ...state,
                buffer: action.buffer ?? [],
                timeoutID: action.timeoutID ?? null
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
                queue: action.queue ?? []
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
