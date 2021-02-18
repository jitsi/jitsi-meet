// @flow

import { ReducerRegistry } from '../../base/redux';

import { _UPDATE_ACCESSIBILITY_INFO } from './actionTypes';


ReducerRegistry.register('features/accessibility-info', (state = {}, action) => {
    switch (action.type) {
    case _UPDATE_ACCESSIBILITY_INFO:
        return {
            ...state,
            ...action.data
        };
    }

    return state;
});
