import ReducerRegistry from '../redux/ReducerRegistry';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';

export interface IAppState {
    app?: any;
}

ReducerRegistry.register<IAppState>('features/base/app', (state = {}, action): IAppState => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { app } = action;

        if (state.app !== app) {
            return {
                ...state,
                app
            };
        }
        break;
    }

    case APP_WILL_UNMOUNT:
        if (state.app === action.app) {
            return {
                ...state,
                app: undefined
            };
        }
        break;
    }

    return state;
});
