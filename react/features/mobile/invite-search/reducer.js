import { assign, ReducerRegistry } from '../../base/redux';

import { _SET_INVITE_SEARCH_SUBSCRIPTIONS } from './actionTypes';

ReducerRegistry.register(
    'features/invite-search',
    (state = {}, action) => {
        switch (action.type) {
        case _SET_INVITE_SEARCH_SUBSCRIPTIONS:
            return assign(state, 'subscriptions', action.subscriptions);
        }

        return state;
    });
