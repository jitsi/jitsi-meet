// @flow

import { ReducerRegistry } from '../base/redux';

import {
    TOGGLE_REACTIONS_VISIBLE,
    SET_REACTIONS_MESSAGE,
    CLEAR_REACTIONS_MESSAGE,
    SET_REACTION_QUEUE
} from './actionTypes';

/**
 * Returns initial state for reactions' part of Redux store.
 *
 * @private
 * @returns {{
 *     visible: boolean,
 *     message: string,
 *     timeoutID: number,
 *     queue: Array
 * }}
 */
function _getInitialState() {
    return {
        /**
         * The indicator that determines whether the reactions menu is visible.
         *
         * @type {boolean}
         */
        visible: false,

        /**
         * A string that contains the message to be added to the chat.
         *
         * @type {string}
         */
        message: '',

        /**
         * A number, non-zero value which identifies the timer created by a call
         * to setTimeout().
         *
         * @type {number|null}
         */
        timeoutID: null,

        /**
         * The array of reactions to animate
         *
         * @type {Array}
         */
        queue: []
    };
}

ReducerRegistry.register(
    'features/reactions',
    (state: Object = _getInitialState(), action: Object) => {
        switch (action.type) {

        case TOGGLE_REACTIONS_VISIBLE:
            return {
                ...state,
                visible: !state.visible
            };

        case SET_REACTIONS_MESSAGE:
            return {
                ...state,
                message: action.message,
                timeoutID: action.timeoutID
            };

        case CLEAR_REACTIONS_MESSAGE:
            return {
                ...state,
                message: '',
                timeoutID: null
            };

        case SET_REACTION_QUEUE: {
            return {
                ...state,
                queue: action.value
            };
        }
        }

        return state;
    });
