/* @flow */

import { assign, ReducerRegistry } from '../../base/redux';

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
            return assign(state, {
                caller: undefined
            });
        case INCOMING_CALL_RECEIVED:
            return assign(state, {
                caller: action.caller
            });
        }

        return state;
    });
