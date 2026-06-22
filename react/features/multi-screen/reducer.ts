import ReducerRegistry from '../base/redux/ReducerRegistry';

import { REMOVE_SECOND_SCREEN, RESET_SECOND_SCREENS, SET_SECOND_SCREEN } from './actionTypes';
import { ISecondScreenConfig } from './types';

export interface IMultiScreenState {

    /**
     * The configured second-screen windows, keyed by window id. This is the
     * single source of truth for which windows exist and what each renders
     * (source + target screen); the middleware reconciles the live windows to
     * it. The non-serializable live handles (the {@code Window}, its
     * {@code <video>} and cloned tracks) are held in a module-scoped map in
     * {@code functions.web.ts}, keyed by the same id — it duplicates none of the
     * configuration kept here.
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
