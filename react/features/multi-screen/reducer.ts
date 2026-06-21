import ReducerRegistry from '../base/redux/ReducerRegistry';

import { REMOVE_SECOND_SCREEN, RESET_SECOND_SCREENS, SET_SECOND_SCREEN } from './actionTypes';
import { ISecondScreenConfig } from './types';

export interface IMultiScreenState {

    /**
     * The configured second-screen windows, keyed by window id. Reflects what
     * the embedder requested; the middleware reconciles the real windows to it.
     */
    screens: { [id: string]: ISecondScreenConfig; };
}

const DEFAULT_STATE: IMultiScreenState = {
    screens: {}
};

ReducerRegistry.register<IMultiScreenState>('features/multi-screen',
(state = DEFAULT_STATE, action): IMultiScreenState => {
    switch (action.type) {
    case SET_SECOND_SCREEN:
        return {
            ...state,
            screens: {
                ...state.screens,
                [action.id]: { source: action.source, screenId: action.screenId }
            }
        };
    case REMOVE_SECOND_SCREEN: {
        const screens = { ...state.screens };

        delete screens[action.id];

        return { ...state, screens };
    }
    case RESET_SECOND_SCREENS:
        return { ...state, screens: {} };
    }

    return state;
});
