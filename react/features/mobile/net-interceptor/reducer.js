import { ReducerRegistry } from '../../base/redux';

import { UPDATE_NETWORK_REQUESTS } from './actionTypes';

ReducerRegistry.register('features/net-interceptor', (state = {}, action) => {
    switch (action.type) {
    case UPDATE_NETWORK_REQUESTS:
        return {
            ...state,
            requests: action.requests
        };
    }

    return state;
});
