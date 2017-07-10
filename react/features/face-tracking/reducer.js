import { ReducerRegistry } from '../base/redux';

import { SHOW_PROMPT, HIDE_PROMPT } from './actionTypes';

/**
 * Listen for actions which changes the state of the face tracking mechanism.
 *
 * @param {Object} state - The Redux state of the feature features/face-tracking
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Object} action.videoElement - the target video element which needs
 * face tracking.
 * @returns {Object}
 */
ReducerRegistry.register(
    'features/face-tracking', (state = {}, action) => {
        switch (action.type) {
        case SHOW_PROMPT:
        case HIDE_PROMPT:
            return Object.assign({}, state, action);
        default:
            return state;
        }
    }
);
