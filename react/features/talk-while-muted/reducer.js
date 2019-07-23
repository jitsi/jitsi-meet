// @flow

import { ReducerRegistry, set } from '../base/redux';

import { SET_CURRENT_NOTIFICATION_UID } from './actionTypes';

/**
 * Reduces the redux actions of the feature talk while muted.
 */
ReducerRegistry.register('features/talk-while-muted', (state = { }, action) => {
    switch (action.type) {
    case SET_CURRENT_NOTIFICATION_UID:
        return set(state, 'currentNotificationUid', action.uid);
    }

    return state;
});
