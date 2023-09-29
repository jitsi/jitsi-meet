import { ComponentType } from 'react';

import ReducerRegistry from '../redux/ReducerRegistry';
import { assign } from '../redux/functions';

import {
    HIDE_DIALOG,
    HIDE_SHEET,
    OPEN_DIALOG,
    OPEN_SHEET
} from './actionTypes';

export interface IDialogState {
    component?: ComponentType;
    componentProps?: Object;
    sheet?: ComponentType;
    sheetProps?: Object;
}

/**
 * Reduces redux actions which show or hide dialogs.
 *
 * @param {IDialogState} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register<IDialogState>('features/base/dialog', (state = {}, action): IDialogState => {
    switch (action.type) {
    case HIDE_DIALOG: {
        const { component } = action;

        if (typeof component === 'undefined' || state.component === component) {
            return assign(state, {
                component: undefined,
                componentProps: undefined
            });
        }
        break;
    }

    case OPEN_DIALOG:
        return assign(state, {
            component: action.component,
            componentProps: action.componentProps
        });

    case HIDE_SHEET:
        return assign(state, {
            sheet: undefined,
            sheetProps: undefined
        });

    case OPEN_SHEET:
        return assign(state, {
            sheet: action.component,
            sheetProps: action.componentProps
        });
    }

    return state;
});
