import ReducerRegistry from '../base/redux/ReducerRegistry';

import { OPEN_WEB_APP } from './actionTypes';

export interface IDeepLinkingState {
    launchInWeb?: boolean;
}

ReducerRegistry.register('features/deep-linking', (state = {}, action) => {
    switch (action.type) {
    case OPEN_WEB_APP: {
        return {
            ...state,
            launchInWeb: true
        };
    }
    }

    return state;
});
