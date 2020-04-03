// @flow

import { ReducerRegistry, set } from '../redux';

import {
    SET_LANGUAGE
} from './actionTypes';
import { DEFAULT_LANGUAGE } from './i18next';

/**
 * The default/initial redux state of the feature base/i18n.
 *
 * @type {{
 *     language: string
 * }}
 */
const DEFAULT_STATE = {
    language: DEFAULT_LANGUAGE
};

ReducerRegistry.register(
    'features/base/i18n',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_LANGUAGE:
            return set(state, 'language', action.language);
        default:
            return state;
        }
    });
