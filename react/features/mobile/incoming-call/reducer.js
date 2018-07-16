// @flow

import { ReducerRegistry, set } from '../../base/redux';

import {
    INCOMING_CALL_ANSWERED,
    INCOMING_CALL_DECLINED,
    INCOMING_CALL_RECEIVED
} from './actionTypes';

ReducerRegistry.register(
    'features/mobile/incoming-call', (state = {}, action) => {
        switch (action.type) {
        case INCOMING_CALL_ANSWERED:
        case INCOMING_CALL_DECLINED:
            return set(state, 'caller', undefined);

        case INCOMING_CALL_RECEIVED:
            return set(state, 'caller', action.caller);
        }

        return state;
    });
