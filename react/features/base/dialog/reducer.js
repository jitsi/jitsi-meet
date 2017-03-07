import { ReducerRegistry, setStateProperties } from '../redux';

import {
    HIDE_DIALOG,
    OPEN_DIALOG
} from './actionTypes';

/**
 * Listen for actions which show or hide dialogs.
 *
 * @param {Object[]} state - Current state.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {{}}
 */
ReducerRegistry.register('features/base/dialog', (state = {}, action) => {
    switch (action.type) {
    case HIDE_DIALOG:
        return setStateProperties(state, {
            component: undefined,
            componentProps: undefined
        });
    case OPEN_DIALOG:
        return setStateProperties(state, {
            component: action.component,
            componentProps: action.componentProps
        });
    }

    return state;
});
