import ReducerRegistry from '../base/redux/ReducerRegistry';

import { DELETE_DESKTOP_SORCES, INIT_DESKTOP_SOURCES } from './actionTypes';
import { IDesktopSources } from './types';

/**
 * The initial state of the web-hid feature.
*/
const DEFAULT_STATE: IDesktopPicker = {
    sources: { } as IDesktopSources
};

export interface IDesktopPicker {
    sources: IDesktopSources;
}

ReducerRegistry.register<IDesktopPicker>(
'features/desktop-picker',
(state: IDesktopPicker = DEFAULT_STATE, action): IDesktopPicker => {
    switch (action.type) {
    case INIT_DESKTOP_SOURCES:
        return {
            ...state,
            sources: action.sources
        };
    case DELETE_DESKTOP_SORCES:
        return {
            ...state,
            ...DEFAULT_STATE
        };
    default:
        return state;
    }
});
