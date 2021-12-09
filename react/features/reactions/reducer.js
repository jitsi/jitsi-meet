// @flow

import { ReducerRegistry } from '../base/redux';

import {
    TOGGLE_REACTIONS_VISIBLE,
    SET_REACTION_QUEUE,
    ADD_REACTION_BUFFER,
    FLUSH_REACTION_BUFFER,
    SHOW_SOUNDS_NOTIFICATION
} from './actionTypes';

/**
 * Returns initial state for reactions' part of Redux store.
 *
 * @private
 * @returns {{
 *     visible: boolean,
 *     message: string,
 *     timeoutID: number,
 *     queue: Array,
 *     notificationDisplayed: boolean
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
         * An array that contains the reactions buffer to be sent.
         *
         * @type {Array}
         */
        buffer: [],

        /**
         * A number, non-zero value which identifies the timer created by a call
         * to setTimeout().
         *
         * @type {number|null}
         */
        timeoutID: null,

        /**
         * The array of reactions to animate.
         *
         * @type {Array}
         */
        queue: [],

        /**
         * Whether or not the disable reaction sounds notification was shown.
         */
        notificationDisplayed: false
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
                queue: action.value
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
