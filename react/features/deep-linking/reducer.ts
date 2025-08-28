import ReducerRegistry from '../base/redux/ReducerRegistry';

import { OPEN_WEB_APP } from './actionTypes';

export interface IDeepLinkingState {
    launchInWeb?: boolean;
}

ReducerRegistry.register<IDeepLinkingState>('features/deep-linking', (state = {}, action): IDeepLinkingState => {
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
