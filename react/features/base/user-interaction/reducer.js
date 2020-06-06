// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import { ReducerRegistry } from '../redux';

import { USER_INTERACTION_RECEIVED } from './actionTypes';

ReducerRegistry.register('features/base/user-interaction', (state = {}, action) => {
    switch (action.type) {
    case APP_WILL_MOUNT:
    case APP_WILL_UNMOUNT:
        return {
            ...state,
            interacted: false
        };

    case USER_INTERACTION_RECEIVED:
        return {
            ...state,
            interacted: true
        };
    }

    return state;
});
