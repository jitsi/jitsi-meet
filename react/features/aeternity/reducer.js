// @flow

import { ReducerRegistry } from '../base/redux';

import { WALLET_FOUND } from './actionTypes';


ReducerRegistry.register('features/aeternity', (state = {}, action) => {

    switch (action.type) {
    case WALLET_FOUND: {
        return {
            ...state,
            hasWallet: true
        };
    }
    }

    return state;
});
