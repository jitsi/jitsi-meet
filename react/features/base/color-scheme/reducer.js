// @flow

import { ReducerRegistry } from '../redux';

import { SET_COLOR_SCHEME } from './actionTypes';

ReducerRegistry.register('features/base/color-scheme', (state = {}, action) => {
    switch (action.type) {
    case SET_COLOR_SCHEME:
        return {
            ...action.colorScheme
        };
    }

    return state;
});
