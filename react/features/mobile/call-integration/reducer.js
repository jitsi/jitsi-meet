import { assign, ReducerRegistry } from '../../base/redux';

import CallKit from './CallKit';
import ConnectionService from './ConnectionService';
import { _SET_CALL_INTEGRATION_SUBSCRIPTIONS } from './actionTypes';

(CallKit || ConnectionService) && ReducerRegistry.register(
    'features/call-integration',
    (state = {}, action) => {
        switch (action.type) {
        case _SET_CALL_INTEGRATION_SUBSCRIPTIONS:
            return assign(state, 'subscriptions', action.subscriptions);
        }

        return state;
    });
