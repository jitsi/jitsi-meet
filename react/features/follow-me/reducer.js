// @flow

import {
    SET_FOLLOW_ME_ACTIVE, SET_FOLLOW_ME_STATE
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
            let newState = set(state, 'followMeActive', action.enabled);

            if (!action.enabled) {
                // clear the state if feature becomes disabled
                newState = set(newState, 'followMeState', undefined);
            }

            return set(newState, 'followMeModerator', action.id);
        }
        case SET_FOLLOW_ME_STATE: {
            return set(state, 'followMeState', action.state);
        }
        }

        return state;
    });
