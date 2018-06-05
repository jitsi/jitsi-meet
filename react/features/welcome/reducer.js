// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';
import {
    SET_SIDEBAR_VISIBLE,
    SET_WELCOME_PAGE_LIST_DEFAULT_PAGE
} from './actionTypes';

/**
 * The Redux store name this feature uses.
 */
const STORE_NAME = 'features/welcome';

/**
 * Sets up the persistence of the feature {@code features/welcome}.
 */
PersistenceRegistry.register(STORE_NAME, {
    defaultPage: true
});

/**
 * Reduces redux actions for the purposes of {@code features/welcome}.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    switch (action.type) {
    case SET_SIDEBAR_VISIBLE:
        return {
            ...state,
            sideBarVisible: action.visible
        };

    case SET_WELCOME_PAGE_LIST_DEFAULT_PAGE:
        return {
            ...state,
            defaultPage: action.pageIndex
        };

    default:
        return state;
    }
});
