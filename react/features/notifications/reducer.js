import { ReducerRegistry } from '../base/redux';

import {
    HIDE_NOTIFICATION,
    SHOW_NOTIFICATION
} from './actionTypes';

/**
 * The initial state of the feature notifications.
 *
 * @type {array}
 */
const DEFAULT_STATE = [];

/**
 * Reduces redux actions which affect the display of notifications.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register('features/notifications',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case HIDE_NOTIFICATION:
            return state.filter(
                notification => notification.uid !== action.uid);

        case SHOW_NOTIFICATION:
            return [
                ...state,
                {
                    component: action.component,
                    props: action.props,
                    timeout: action.timeout,
                    uid: action.uid
                }
            ];
        }

        return state;
    });
