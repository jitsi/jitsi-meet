import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { CAPTURE_EVENTS } from '../remote-control/actionTypes';

import { disableKeyboardShortcuts, enableKeyboardShortcuts } from './actions';

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { dispatch } = store;

    switch (action.type) {
    case CAPTURE_EVENTS:
        if (action.isCapturingEvents) {
            dispatch(disableKeyboardShortcuts());
        } else {
            dispatch(enableKeyboardShortcuts());
        }

        return next(action);
    case SET_CONFIG: {
        const result = next(action);

        const state = store.getState();
        const { disableShortcuts } = state['features/base/config'];

        if (disableShortcuts !== undefined) {
            if (disableShortcuts) {
                dispatch(disableKeyboardShortcuts());
            } else {
                dispatch(enableKeyboardShortcuts());
            }
        }

        return result;
    }
    }

    return next(action);
});
