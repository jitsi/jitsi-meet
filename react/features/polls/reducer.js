// @flow

import { ReducerRegistry } from '../base/redux';

const INITIAL_STATE = {};

const STORE_NAME = 'features/polls';

ReducerRegistry.register(STORE_NAME, (state = INITIAL_STATE, action) => {
    switch(action.type) {
    default:
        return state;
    }
});