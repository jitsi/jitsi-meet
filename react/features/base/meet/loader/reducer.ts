import { AnyAction } from 'redux';
import { HIDE_LOADER, SHOW_LOADER } from './actionTypes';
import { ILoaderState } from './types';
import ReducerRegistry from '../../../base/redux/ReducerRegistry';

const DEFAULT_STATE: ILoaderState = {
    isVisible: false,
    text: undefined,
    textKey: undefined,
    id: undefined,
};

ReducerRegistry.register<ILoaderState>('features/base/meet/loader', (state = DEFAULT_STATE, action: AnyAction) => {
    switch (action.type) {
        case SHOW_LOADER:
            return {
                ...state,
                isVisible: true,
                text: action.text,
                textKey: action.textKey,
                id: action.id,
            };

        case HIDE_LOADER:
            if (action.id && state.id !== action.id) {
                return state;
            }

            return {
                ...state,
                isVisible: false,
                text: undefined,
                textKey: undefined,
                id: undefined,
            };

        default:
            return state;
    }
});
