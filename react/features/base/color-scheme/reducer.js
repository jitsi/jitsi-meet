// @flow

import _ from 'lodash';

import { ReducerRegistry } from '../redux';

import { SET_COLOR_SCHEME } from './actionTypes';

/**
 * The reducer of the feature {@code base/color-scheme}.
 *
 * @returns {Function}
 */
ReducerRegistry.register('features/base/color-scheme', (state = {}, action) => {
    switch (action.type) {
    case SET_COLOR_SCHEME:
        return _.cloneDeep(action.colorScheme) || state;
    }

    return state;
});
