import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    SET_FOLLOW_ME,
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_RECORDER,
    SET_FOLLOW_ME_STATE
} from './actionTypes';

export interface IFollowMeState {
    followMeEnabled?: boolean;
    followMeRecorderEnabled?: boolean;
    moderator?: string;
    recorder?: boolean;
    state?: {
        [key: string]: string;
    };
}

/**
 * Listen for actions that contain the Follow Me feature active state, so that it can be stored.
 */
ReducerRegistry.register<IFollowMeState>(
    'features/follow-me',
    (state = {}, action): IFollowMeState => {
        switch (action.type) {
        case SET_FOLLOW_ME:
            return set(state, 'followMeEnabled', action.enabled);
        case SET_FOLLOW_ME_MODERATOR: {
            let newState = set(state, 'moderator', action.id);

            if (action.id) {
                newState = set(newState, 'recorder', action.forRecorder);
            } else {
                // clear the state if feature becomes disabled
                newState = set(newState, 'state', undefined);
                newState = set(newState, 'recorder', undefined);
            }

            return newState;
        }
        case SET_FOLLOW_ME_RECORDER:
            return { ...state,
                followMeRecorderEnabled: action.enabled,
                followMeEnabled: action.enabled
            };
        case SET_FOLLOW_ME_STATE: {
            return set(state, 'state', action.state);
        }
        }

        return state;
    });
