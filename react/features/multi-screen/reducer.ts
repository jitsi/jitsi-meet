import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    REMOVE_SECOND_SCREEN,
    RESET_SECOND_SCREENS,
    SET_SECOND_SCREEN,
    SET_SECOND_SCREEN_WINDOW
} from './actionTypes';
import { ISecondScreenEntry } from './types';

export interface IMultiScreenState {

    /**
     * The second-screen windows, keyed by window id. This is the single source
     * of truth for the feature: each entry holds both the configuration (source
     * + target screen) and the live window handle. Redux state is never
     * serialized for storage here, so the non-serializable handle (the
     * {@code Window}, its {@code <video>} and tracks) lives on the entry too,
     * rather than in a separate module-scoped map; the middleware reconciles the
     * live windows to this state.
     */
    screens: { [id: string]: ISecondScreenEntry; };
}

const DEFAULT_STATE: IMultiScreenState = {
    screens: {}
};

ReducerRegistry.register<IMultiScreenState>('features/multi-screen',
(state = DEFAULT_STATE, action): IMultiScreenState => {
    switch (action.type) {
    case SET_SECOND_SCREEN:

        // Merge so a re-configuration of an existing window keeps its live handle.
        return {
            ...state,
            screens: {
                ...state.screens,
                [action.id]: {
                    ...state.screens[action.id],
                    source: action.source,
                    screenId: action.screenId
                }
            }
        };
    case SET_SECOND_SCREEN_WINDOW: {
        const entry = state.screens[action.id];

        if (!entry) {
            return state;
        }

        return {
            ...state,
            screens: {
                ...state.screens,
                [action.id]: { ...entry, handle: action.handle }
            }
        };
    }
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
