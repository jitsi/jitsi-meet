import ReducerRegistry from '../redux/ReducerRegistry';

import { HIDE_TOOLTIP, SHOW_TOOLTIP } from './actionTypes';

export interface ITooltipState {
    content: string;
    previousContent: string;
    visible: boolean;
}

const DEFAULT_STATE = {
    content: '',
    previousContent: '',
    visible: false
};

/**
 * Reduces redux actions which mark the tooltip as displayed or hidden.
 *
 * @param {IDialogState} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register<ITooltipState>('features/base/tooltip', (state = DEFAULT_STATE, action): ITooltipState => {
    switch (action.type) {
    case SHOW_TOOLTIP:
        return {
            content: action.content,
            previousContent: state.content,
            visible: true
        };
    case HIDE_TOOLTIP: {
        // The tooltip can be marked as hidden only if the hide action
        // is dispatched by the tooltip that is displayed.
        if (action.content === state.content) {
            return {
                content: '',
                previousContent: '',
                visible: false
            };
        }

        return state;
    }
    }

    return state;
});
