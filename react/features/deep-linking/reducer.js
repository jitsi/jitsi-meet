/* @flow */

import { ReducerRegistry } from '../base/redux';

import { OPEN_WEB_APP } from './actionTypes';

ReducerRegistry.register('features/deep-linking', (state = {}, action) => {
    switch (action.type) {
    case OPEN_WEB_APP: {
        return {
            ...state,
            launchInWeb: true
        };
    }
    }

    return state;
});
