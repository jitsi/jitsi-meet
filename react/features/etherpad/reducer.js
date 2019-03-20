// @flow

import { ReducerRegistry } from '../base/redux';

import {
    ETHERPAD_INITIALIZED,
    SET_DOCUMENT_EDITING_STATUS
} from './actionTypes';

const DEFAULT_STATE = {

    /**
     * Whether or not Etherpad is currently open.
     *
     * @public
     * @type {boolean}
     */
    editing: false,

    /**
     * Whether or not Etherpad is ready to use.
     *
     * @public
     * @type {boolean}
     */
    initialized: false
};

/**
 * Reduces the Redux actions of the feature features/etherpad.
 */
ReducerRegistry.register(
    'features/etherpad',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ETHERPAD_INITIALIZED:
            return {
                ...state,
                initialized: true
            };

        case SET_DOCUMENT_EDITING_STATUS:
            return {
                ...state,
                editing: action.editing
            };

        default:
            return state;
        }
    });
