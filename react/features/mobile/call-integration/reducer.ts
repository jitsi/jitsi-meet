import ReducerRegistry from '../../base/redux/ReducerRegistry';
import { set } from '../../base/redux/functions';

import CallKit from './CallKit';
import ConnectionService from './ConnectionService';
import { _SET_CALL_INTEGRATION_SUBSCRIPTIONS } from './actionTypes';

export interface ICallIntegrationState {
    subscriptions?: any;
}

(CallKit || ConnectionService) && ReducerRegistry.register<ICallIntegrationState>(
    'features/call-integration',
    (state = {}, action): ICallIntegrationState => {
        switch (action.type) {
        case _SET_CALL_INTEGRATION_SUBSCRIPTIONS:
            return set(state, 'subscriptions', action.subscriptions);
        }

        return state;
    });
