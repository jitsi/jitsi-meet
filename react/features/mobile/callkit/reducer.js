import { assign, ReducerRegistry } from '../../base/redux';

import { _SET_CALLKIT_SUBSCRIPTIONS } from './actionTypes';
import CallKit from './CallKit';

CallKit && ReducerRegistry.register(
    'features/callkit',
    (state = {}, action) => {
        switch (action.type) {
        case _SET_CALLKIT_SUBSCRIPTIONS:
            return assign(state, 'subscriptions', action.subscriptions);
        }

        return state;
    });
