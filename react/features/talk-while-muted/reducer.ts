import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import { SET_CURRENT_NOTIFICATION_UID } from './actionTypes';

export interface ITalkWhileMutedState {
    currentNotificationUid?: string;
}

/**
 * Reduces the redux actions of the feature talk while muted.
 */
ReducerRegistry.register<ITalkWhileMutedState>('features/talk-while-muted',
(state = {}, action): ITalkWhileMutedState => {
    switch (action.type) {
    case SET_CURRENT_NOTIFICATION_UID:
        return set(state, 'currentNotificationUid', action.uid);
    }

    return state;
});
