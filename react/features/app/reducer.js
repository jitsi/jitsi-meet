import { ReducerRegistry } from '../base/redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';

/**
 * The initial Redux state of features/app.
 */
const INITIAL_STATE = {
    /**
     * The one and only (i.e. singleton) App instance which is currently
     * mounted.
     *
     * @type {App}
     */
    app: undefined
};

ReducerRegistry.register('features/app', (state = INITIAL_STATE, action) => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        if (state.app !== action.app) {
            return {
                ...state,
                app: action.app
            };
        }
        break;

    case APP_WILL_UNMOUNT:
        if (state.app === action.app) {
            return {
                ...state,
                app: INITIAL_STATE.app
            };
        }
        break;
    }

    return state;
});
