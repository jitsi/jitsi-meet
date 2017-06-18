import { ReducerRegistry } from '../base/redux';

import { ENABLE_FACE_TRACKING } from './actionTypes';

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
        case ENABLE_FACE_TRACKING:
            return {
                ...state,
                videoElement: action.videoElement
            };
        default:
            return state;
        }
    }
);
