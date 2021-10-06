// @flow

import type { Dispatch } from 'redux';

import { TOGGLE_TOOLBOX_VISIBLE } from './actionTypes';

export * from './actions.any';

/**
 * Action to toggle the toolbox visibility.
 *
 * @returns {Function}
 */
export function toggleToolboxVisible() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { toolbarConfig: { alwaysVisible } } = state['features/base/config'];
        const { visible } = state['features/toolbox'];

        if (visible && alwaysVisible) {
            return;
        }

        dispatch({
            type: TOGGLE_TOOLBOX_VISIBLE
        });
    };
}
