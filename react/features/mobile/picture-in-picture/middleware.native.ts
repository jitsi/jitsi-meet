import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import { APP_STATE_CHANGED } from '../background/actionTypes';

import { ENABLE_IOS_PIP } from './actionTypes';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED: {
        const state = store.getState();
        const { dispatch } = store;
        const { appState } = state['features/background'];

        if (appState === 'inactive') {
            dispatch({
                type: ENABLE_IOS_PIP,
                enableIosPIP: false
            });
        }
        break;
    }
    }

    return result;
});
