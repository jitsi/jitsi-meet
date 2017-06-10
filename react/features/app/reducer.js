import { ReducerRegistry } from '../base/redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';

ReducerRegistry.register('features/app', (state = {}, action) => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { app } = action;

        if (state.app !== app) {
            return {
                ...state,

                /**
                 * The one and only (i.e. singleton) App instance which is
                 * currently mounted.
                 *
                 * @type {App}
                 */
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
