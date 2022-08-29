import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { SCREEN_SHARE_PARTICIPANTS_UPDATED } from './actionTypes';

export interface IMobileExternalApiState {
    screenShares: string[];
}

const DEFAULT_STATE = {
    screenShares: []
};

ReducerRegistry.register('features/mobile/external-api', (state: IMobileExternalApiState = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SCREEN_SHARE_PARTICIPANTS_UPDATED: {
        return {
            ...state,
            screenShares: action.participantIds
        };
    }
    }

    return state;
});
