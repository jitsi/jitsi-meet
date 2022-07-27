import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app/actionTypes';
import ReducerRegistry from '../redux/ReducerRegistry';

import { USER_INTERACTION_RECEIVED } from './actionTypes';

export interface IUserInteractionState {
    interacted?: boolean;
}


ReducerRegistry.register('features/base/user-interaction', (state: IUserInteractionState = {}, action) => {
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
