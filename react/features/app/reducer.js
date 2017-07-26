import { SET_ROOM } from '../base/conference';
import { SET_LOCATION_URL } from '../base/connection';

import { ReducerRegistry, set } from '../base/redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';
import { _getRouteToRender } from './functions';

ReducerRegistry.register('features/app', (state = {}, action) => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { app } = action;

        if (state.app !== app) {
            return {
                ...state,

                /**
                 * The one and only (i.e. singleton) {@link App} instance which
                 * is currently mounted.
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

    case SET_LOCATION_URL:
        return set(state, 'getRouteToRender', undefined);

    case SET_ROOM:
        return set(state, 'getRouteToRender', _getRouteToRender);
    }

    return state;
});
