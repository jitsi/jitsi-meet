// @flow

import {
    SET_FOLLOW_ME_ACTIVE
} from './actionTypes';
import { ReducerRegistry, set } from '../base/redux';

/**
 * Listen for actions that contain the Follow Me feature active state, so that it can be stored.
 */
ReducerRegistry.register(
    'features/follow-me',
    (state = {}, action) => {
        switch (action.type) {

        case SET_FOLLOW_ME_ACTIVE: {
            const newState = set(state, 'followMeActive', action.enabled);

            return set(newState, 'followMeModerator', action.id);
        }
        }

        return state;
    });
